"""
MoodMuse Studio - FastAPI Server
Main API server for the music generation pipeline.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from models import (
    Creation,
    CreationUpdate,
    GenerationPreview,
    GenerationStatus,
    MusicGenerationRequest,
    QuickGenerateRequest,
)
from music_service import MusicGenerationService
from prompt_engine import build_cinematic_prompt, build_music_prompt
from storage import CreationStorage

# Load environment
load_dotenv()

import sys

# Ensure UTF-8 console output on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# ── Application Lifespan ─────────────────────────────────────────────────────

storage_dir = os.getenv("STORAGE_DIR", "./storage")
music_service = MusicGenerationService(storage_dir=storage_dir)
creation_storage = CreationStorage(storage_dir=storage_dir)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown."""
    print("[INFO] MoodMuse Studio API starting...")
    print(f"[INFO] Storage directory: {Path(storage_dir).absolute()}")

    # Check provider status
    for status in music_service.get_all_provider_status():
        state = "[OK]" if status.configured else "[--]"
        print(f"  {state} {status.name}: {'configured' if status.configured else 'not configured'}")

    yield
    print("[INFO] MoodMuse Studio API shutting down...")


# ── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="MoodMuse Studio API",
    description="AI Music Generation from Mood & Emotion",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health & Status ──────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "MoodMuse Studio"}


@app.get("/api/providers")
async def get_providers():
    """Get status of all music generation providers."""
    statuses = music_service.get_all_provider_status()
    active = music_service.get_active_provider()
    return {
        "providers": [s.model_dump() for s in statuses],
        "active_provider": active[0].value if active else None,
        "any_configured": active is not None,
    }


# ── Music Generation ────────────────────────────────────────────────────────

@app.post("/api/generate")
async def generate_music(request: MusicGenerationRequest):
    """
    Generate music from a full wizard questionnaire response.
    Returns a generation job with status tracking.
    """
    # Build prompt from user input
    prompt = build_music_prompt(request)

    # Check if any provider is configured
    if not music_service.get_active_provider():
        # Return prompt preview for graceful fallback
        provider_statuses = music_service.get_all_provider_status()
        preview = GenerationPreview(
            prompt=prompt,
            provider_recommendation="We recommend Hugging Face Inference API with MusicGen (free). "
                                   "Sign up at https://huggingface.co and create a token at "
                                   "https://huggingface.co/settings/tokens",
            setup_instructions=(
                "To enable music generation:\n"
                "1. Get a free Hugging Face API token from https://huggingface.co/settings/tokens\n"
                "2. Create a .env file in the backend/ directory\n"
                "3. Add: HF_API_TOKEN=your_token_here\n"
                "4. Restart the server"
            ),
            generation_settings=request.model_dump(),
        )
        return JSONResponse(
            status_code=200,
            content={
                "status": "no_provider",
                "preview": preview.model_dump(),
                "message": "No music generation provider configured. Here's your prompt to use externally.",
            },
        )

    # Generate title
    title = request.title or f"{request.vibe.value.replace('_', ' ').title()} {request.style.value.replace('_', ' ').title()}"

    # Start generation
    job = await music_service.generate_music(
        prompt=prompt,
        duration_seconds=request.sound_design.duration_seconds,
        title=title,
        metadata=request.model_dump(),
    )

    # If generation succeeded, save as creation
    if job.status == GenerationStatus.COMPLETED:
        creation = Creation(
            id=job.id,
            title=title,
            vibe=request.vibe.value,
            style=request.style.value,
            emotional_direction=request.emotional_direction.value,
            prompt_used=prompt,
            provider=job.provider.value if job.provider else "",
            audio_filename=f"{job.id}.wav",
            audio_url=f"/api/audio/{job.id}",
            duration_seconds=request.sound_design.duration_seconds,
            generation_settings=request.model_dump(),
            scene_description=request.scene_description,
            is_cinematic=request.is_cinematic,
        )
        creation_storage.add(creation)
        return {
            "status": "completed",
            "job": job.model_dump(),
            "creation": creation.model_dump(),
        }

    return {
        "status": job.status.value,
        "job": job.model_dump(),
    }


@app.post("/api/generate/quick")
async def quick_generate(request: QuickGenerateRequest):
    """Quick generation with minimal settings."""
    full_request = MusicGenerationRequest(
        vibe=request.vibe,
        custom_vibe=request.custom_vibe,
        style=request.style,
    )
    return await generate_music(full_request)


@app.post("/api/generate/cinematic")
async def generate_cinematic(
    scene_description: str = "a hero entering a battlefield",
    instruments: list[str] | None = None,
    intensity: str = "moderate",
    ending: str = "peaceful",
    duration_seconds: int = 15,
):
    """Generate cinematic BGM from a scene description."""
    prompt = build_cinematic_prompt(scene_description, instruments, intensity, ending)

    if not music_service.get_active_provider():
        preview = GenerationPreview(
            prompt=prompt,
            provider_recommendation="We recommend Hugging Face Inference API with MusicGen (free).",
            setup_instructions=(
                "To enable music generation:\n"
                "1. Get a free Hugging Face API token\n"
                "2. Set HF_API_TOKEN in backend/.env\n"
                "3. Restart the server"
            ),
            generation_settings={
                "scene": scene_description,
                "instruments": instruments,
                "intensity": intensity,
                "ending": ending,
            },
        )
        return JSONResponse(
            status_code=200,
            content={
                "status": "no_provider",
                "preview": preview.model_dump(),
            },
        )

    job = await music_service.generate_music(
        prompt=prompt,
        duration_seconds=duration_seconds,
        title=f"Cinematic: {scene_description[:50]}",
    )

    if job.status == GenerationStatus.COMPLETED:
        creation = Creation(
            id=job.id,
            title=f"Cinematic: {scene_description[:50]}",
            vibe="cinematic",
            style="orchestral",
            emotional_direction=ending,
            prompt_used=prompt,
            provider=job.provider.value if job.provider else "",
            audio_filename=f"{job.id}.wav",
            audio_url=f"/api/audio/{job.id}",
            duration_seconds=duration_seconds,
            scene_description=scene_description,
            is_cinematic=True,
            generation_settings={
                "scene": scene_description,
                "instruments": instruments,
                "intensity": intensity,
                "ending": ending,
            },
        )
        creation_storage.add(creation)
        return {
            "status": "completed",
            "job": job.model_dump(),
            "creation": creation.model_dump(),
        }

    return {
        "status": job.status.value,
        "job": job.model_dump(),
    }


@app.post("/api/prompt-preview")
async def preview_prompt(request: MusicGenerationRequest):
    """Preview the generated prompt without triggering generation."""
    prompt = build_music_prompt(request)
    return {
        "prompt": prompt,
        "settings": request.model_dump(),
    }


# ── Audio Serving ────────────────────────────────────────────────────────────

@app.get("/api/audio/{job_id}")
async def get_audio(job_id: str):
    """Serve generated audio file."""
    audio_path = music_service.get_audio_path(job_id)
    if not audio_path:
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(
        audio_path,
        media_type="audio/wav",
        filename=f"moodmuse_{job_id[:8]}.wav",
    )


# ── Creations CRUD ──────────────────────────────────────────────────────────

@app.get("/api/creations")
async def list_creations():
    """List all saved creations."""
    creations = creation_storage.get_all()
    return {"creations": [c.model_dump() for c in creations]}


@app.get("/api/creations/{creation_id}")
async def get_creation(creation_id: str):
    """Get a specific creation."""
    creation = creation_storage.get(creation_id)
    if not creation:
        raise HTTPException(status_code=404, detail="Creation not found")
    return creation.model_dump()


@app.patch("/api/creations/{creation_id}")
async def update_creation(creation_id: str, update: CreationUpdate):
    """Update a creation (rename, favorite)."""
    creation = creation_storage.update(creation_id, update)
    if not creation:
        raise HTTPException(status_code=404, detail="Creation not found")
    return creation.model_dump()


@app.delete("/api/creations/{creation_id}")
async def delete_creation(creation_id: str):
    """Delete a creation and its audio."""
    success = creation_storage.delete(creation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Creation not found")
    return {"deleted": True}


# ── Job Status ───────────────────────────────────────────────────────────────

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a generation job."""
    job = music_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.model_dump()


# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
