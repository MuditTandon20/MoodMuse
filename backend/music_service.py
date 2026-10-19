"""
MoodMuse Studio - Music Generation Service
Provider-independent architecture for music generation.
Supports Hugging Face Inference API (MusicGen) as primary free provider.
"""
from __future__ import annotations

import asyncio
import base64
import os
import time
import uuid
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

import httpx

from models import (
    GenerationJob,
    GenerationStatus,
    ProviderStatus,
    ProviderType,
    Creation,
)


# ── Abstract Provider Interface ──────────────────────────────────────────────

class MusicProvider(ABC):
    """Base interface for all music generation providers."""

    @abstractmethod
    async def generate(self, prompt: str, duration_seconds: int = 15) -> bytes | None:
        """Generate audio from a text prompt. Returns raw audio bytes or None on failure."""
        ...

    @abstractmethod
    def get_status(self) -> ProviderStatus:
        """Return the current provider configuration status."""
        ...

    @abstractmethod
    def is_configured(self) -> bool:
        """Check if this provider has valid credentials."""
        ...


# ── Hugging Face MusicGen Provider ──────────────────────────────────────────

class HuggingFaceMusicGenProvider(MusicProvider):
    """
    Generates music via Hugging Face Inference API using Meta's MusicGen model.
    Free tier with rate limits.
    """

    API_URL = "https://api-inference.huggingface.co/models/facebook/musicgen-small"
    TIMEOUT = 120  # Audio generation can take a while

    def __init__(self, api_token: str | None = None):
        self.api_token = api_token or os.getenv("HF_API_TOKEN", "")

    def is_configured(self) -> bool:
        return bool(self.api_token and self.api_token.strip())

    def get_status(self) -> ProviderStatus:
        return ProviderStatus(
            provider=ProviderType.HUGGINGFACE,
            configured=self.is_configured(),
            name="Hugging Face MusicGen",
            description="Meta's MusicGen model via Hugging Face Inference API. Generates instrumental music from text prompts.",
            supports_vocals=False,
            max_duration_seconds=30,
            is_free=True,
            note="Free tier with rate limits (~few hundred requests/hour). Get your token at https://huggingface.co/settings/tokens",
        )

    async def generate(self, prompt: str, duration_seconds: int = 15) -> bytes | None:
        """
        Send a text prompt to HF Inference API and receive generated audio bytes.
        Returns WAV/FLAC audio bytes on success, None on failure.
        """
        if not self.is_configured():
            return None

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

        # MusicGen parameters
        # max_new_tokens controls generation length (~50 tokens ≈ 1 second of audio)
        tokens_per_second = 50
        max_tokens = min(duration_seconds * tokens_per_second, 1500)  # Cap at 30s

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
            },
        }

        async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
            # First attempt - may need to wait for model to load
            for attempt in range(3):
                try:
                    response = await client.post(
                        self.API_URL,
                        json=payload,
                        headers=headers,
                    )

                    if response.status_code == 200:
                        return response.content

                    if response.status_code == 503:
                        # Model is loading, wait and retry
                        error_data = response.json()
                        wait_time = error_data.get("estimated_time", 30)
                        wait_time = min(wait_time, 60)  # Cap wait
                        await asyncio.sleep(wait_time)
                        continue

                    if response.status_code == 429:
                        # Rate limited
                        raise Exception("Rate limited by Hugging Face. Please try again later.")

                    # Other errors
                    error_text = response.text
                    raise Exception(f"HF API error ({response.status_code}): {error_text}")

                except httpx.TimeoutException:
                    if attempt < 2:
                        await asyncio.sleep(5)
                        continue
                    raise Exception("Request timed out. The model may be under heavy load.")

        return None


# ── Replicate Provider (Placeholder for paid option) ─────────────────────────

class ReplicateMusicGenProvider(MusicProvider):
    """
    Generates music via Replicate API using MusicGen.
    Pay-per-use (~$0.035 per generation).
    """

    def __init__(self, api_token: str | None = None):
        self.api_token = api_token or os.getenv("REPLICATE_API_TOKEN", "")

    def is_configured(self) -> bool:
        return bool(self.api_token and self.api_token.strip())

    def get_status(self) -> ProviderStatus:
        return ProviderStatus(
            provider=ProviderType.REPLICATE,
            configured=self.is_configured(),
            name="Replicate MusicGen",
            description="MusicGen via Replicate. Higher quality with stereo-large model. Pay-per-use.",
            supports_vocals=False,
            max_duration_seconds=30,
            is_free=False,
            note="~$0.035 per generation. Get token at https://replicate.com/account/api-tokens",
        )

    async def generate(self, prompt: str, duration_seconds: int = 15) -> bytes | None:
        if not self.is_configured():
            return None

        headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
        }

        payload = {
            "version": "671ac645ce5e552cc63a54a2bbff63fcf798043055f2a2c16680ee55e3a16fc2",
            "input": {
                "prompt": prompt,
                "duration": min(duration_seconds, 30),
                "model_version": "stereo-large",
                "output_format": "wav",
            },
        }

        async with httpx.AsyncClient(timeout=180) as client:
            # Create prediction
            response = await client.post(
                "https://api.replicate.com/v1/predictions",
                json=payload,
                headers=headers,
            )

            if response.status_code != 201:
                raise Exception(f"Replicate API error: {response.text}")

            prediction = response.json()
            prediction_url = prediction["urls"]["get"]

            # Poll for completion
            for _ in range(60):
                await asyncio.sleep(3)
                poll_response = await client.get(prediction_url, headers=headers)
                poll_data = poll_response.json()

                if poll_data["status"] == "succeeded":
                    output_url = poll_data["output"]
                    if isinstance(output_url, list):
                        output_url = output_url[0]
                    audio_response = await client.get(output_url)
                    return audio_response.content

                if poll_data["status"] == "failed":
                    raise Exception(f"Replicate generation failed: {poll_data.get('error', 'Unknown error')}")

            raise Exception("Replicate generation timed out")


# ── Music Generation Service ────────────────────────────────────────────────

class MusicGenerationService:
    """
    Main service that manages providers, generation jobs, and rate limiting.
    """

    def __init__(self, storage_dir: str = "./storage"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        (self.storage_dir / "audio").mkdir(exist_ok=True)

        # Initialize providers
        self.providers: dict[ProviderType, MusicProvider] = {
            ProviderType.HUGGINGFACE: HuggingFaceMusicGenProvider(),
            ProviderType.REPLICATE: ReplicateMusicGenProvider(),
        }

        # Active jobs
        self.jobs: dict[str, GenerationJob] = {}

        # Rate limiting
        self.generation_timestamps: list[float] = []
        self.max_per_hour = int(os.getenv("MAX_GENERATIONS_PER_HOUR", "10"))
        self.max_per_day = int(os.getenv("MAX_GENERATIONS_PER_DAY", "50"))

    def get_active_provider(self) -> tuple[ProviderType, MusicProvider] | None:
        """Get the first configured provider."""
        # Prefer HuggingFace (free) first
        for provider_type in [ProviderType.HUGGINGFACE, ProviderType.REPLICATE]:
            provider = self.providers.get(provider_type)
            if provider and provider.is_configured():
                return provider_type, provider
        return None

    def get_all_provider_status(self) -> list[ProviderStatus]:
        """Get status of all registered providers."""
        return [p.get_status() for p in self.providers.values()]

    def check_rate_limit(self) -> tuple[bool, str]:
        """Check if we're within rate limits."""
        now = time.time()
        hour_ago = now - 3600
        day_ago = now - 86400

        # Clean old timestamps
        self.generation_timestamps = [
            ts for ts in self.generation_timestamps if ts > day_ago
        ]

        hour_count = sum(1 for ts in self.generation_timestamps if ts > hour_ago)
        day_count = len(self.generation_timestamps)

        if hour_count >= self.max_per_hour:
            return False, f"Hourly limit reached ({self.max_per_hour}/hour). Please try again later."

        if day_count >= self.max_per_day:
            return False, f"Daily limit reached ({self.max_per_day}/day). Please try again tomorrow."

        return True, ""

    async def generate_music(
        self,
        prompt: str,
        duration_seconds: int = 15,
        title: str = "Untitled Composition",
        metadata: dict | None = None,
    ) -> GenerationJob:
        """
        Start a music generation job.
        Returns a GenerationJob for tracking status.
        """
        # Check rate limit
        allowed, reason = self.check_rate_limit()
        if not allowed:
            job = GenerationJob(
                status=GenerationStatus.FAILED,
                error_message=reason,
                prompt_used=prompt,
            )
            return job

        # Find active provider
        provider_info = self.get_active_provider()
        if not provider_info:
            job = GenerationJob(
                status=GenerationStatus.FAILED,
                error_message="No music generation provider configured. Please set HF_API_TOKEN in your .env file.",
                prompt_used=prompt,
                provider=ProviderType.NONE,
            )
            self.jobs[job.id] = job
            return job

        provider_type, provider = provider_info

        # Create job
        job = GenerationJob(
            status=GenerationStatus.PROCESSING,
            progress_message="Generating your composition...",
            prompt_used=prompt,
            provider=provider_type,
        )
        self.jobs[job.id] = job

        # Record timestamp for rate limiting
        self.generation_timestamps.append(time.time())

        # Run generation (async)
        try:
            audio_bytes = await provider.generate(prompt, duration_seconds)

            if audio_bytes:
                # Save audio file
                filename = f"{job.id}.wav"
                filepath = self.storage_dir / "audio" / filename
                filepath.write_bytes(audio_bytes)

                job.status = GenerationStatus.COMPLETED
                job.progress_message = "Your composition is ready!"

                # Store as creation
                return job
            else:
                job.status = GenerationStatus.FAILED
                job.error_message = "Generation returned no audio data."

        except Exception as e:
            job.status = GenerationStatus.FAILED
            job.error_message = str(e)

        self.jobs[job.id] = job
        return job

    def get_job(self, job_id: str) -> GenerationJob | None:
        return self.jobs.get(job_id)

    def get_audio_path(self, job_id: str) -> Path | None:
        filepath = self.storage_dir / "audio" / f"{job_id}.wav"
        if filepath.exists():
            return filepath
        return None

    def delete_audio(self, job_id: str) -> bool:
        filepath = self.storage_dir / "audio" / f"{job_id}.wav"
        if filepath.exists():
            filepath.unlink()
            return True
        return False
