"""
MoodMuse Studio - Music Generation Models
Pydantic models for the music generation pipeline.
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
import uuid


# ── Enums ────────────────────────────────────────────────────────────────────

class VibeCategoryEnum(str, Enum):
    HEARTBREAK = "heartbreak"
    PEACEFUL = "peaceful"
    ROMANTIC = "romantic"
    DARK = "dark"
    VILLAIN = "villain"
    EPIC = "epic"
    MOTIVATIONAL = "motivational"
    NOSTALGIC = "nostalgic"
    RAINY_NIGHT = "rainy_night"
    SCIFI = "scifi"
    FANTASY = "fantasy"
    HORROR = "horror"
    ANIME = "anime"
    CINEMATIC = "cinematic"
    CUSTOM = "custom"


class MusicStyleEnum(str, Enum):
    INSTRUMENTAL = "instrumental"
    FULL_SONG = "full_song"
    VOCAL_MELODY = "vocal_melody"
    PIANO = "piano"
    ORCHESTRAL = "orchestral"
    GUITAR = "guitar"
    ELECTRONIC = "electronic"
    LOFI = "lofi"
    BOLLYWOOD = "bollywood"
    INDIE = "indie"
    ROCK = "rock"
    HYBRID = "hybrid"


class EmotionalDirectionEnum(str, Enum):
    STAY = "stay"
    INTENSIFY = "intensify"
    NOSTALGIC = "nostalgic"
    SUSPENSE = "suspense"
    FREEDOM = "freedom"
    UPLIFTING = "uplifting"
    QUIET_TO_EPIC = "quiet_to_epic"
    PEACEFUL_END = "peaceful_end"
    CUSTOM = "custom"


class EnergyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class IntensityLevel(str, Enum):
    SUBTLE = "subtle"
    MODERATE = "moderate"
    DRAMATIC = "dramatic"


class TempoLevel(str, Enum):
    SLOW = "slow"
    MEDIUM = "medium"
    FAST = "fast"


class AtmosphereType(str, Enum):
    INTIMATE = "intimate"
    SPACIOUS = "spacious"
    DARK = "dark"
    WARM = "warm"
    FUTURISTIC = "futuristic"
    GRAND = "grand"


class VocalType(str, Enum):
    NONE = "none"
    WORDLESS = "wordless"
    LYRICS = "lyrics"


class LyricLanguage(str, Enum):
    ENGLISH = "english"
    HINDI = "hindi"
    HINGLISH = "hinglish"


class GenerationStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ProviderType(str, Enum):
    HUGGINGFACE = "huggingface"
    REPLICATE = "replicate"
    NONE = "none"


# ── Request Models ───────────────────────────────────────────────────────────

class SoundDesignSettings(BaseModel):
    energy: EnergyLevel = EnergyLevel.MEDIUM
    intensity: IntensityLevel = IntensityLevel.MODERATE
    tempo: TempoLevel = TempoLevel.MEDIUM
    sound_palette: list[str] = Field(default_factory=lambda: ["mixed"])
    atmosphere: AtmosphereType = AtmosphereType.WARM
    duration_seconds: int = Field(default=15, ge=5, le=30)
    vocals: VocalType = VocalType.NONE


class LyricsSettings(BaseModel):
    has_lyrics: bool = False
    user_lyrics: Optional[str] = None
    theme: Optional[str] = None
    language: LyricLanguage = LyricLanguage.ENGLISH
    perspective: Optional[str] = None
    mood: Optional[str] = None


class MusicGenerationRequest(BaseModel):
    """Complete user request for music generation."""
    vibe: VibeCategoryEnum = VibeCategoryEnum.PEACEFUL
    custom_vibe: Optional[str] = None
    style: MusicStyleEnum = MusicStyleEnum.INSTRUMENTAL
    emotional_direction: EmotionalDirectionEnum = EmotionalDirectionEnum.STAY
    custom_emotional_direction: Optional[str] = None
    sound_design: SoundDesignSettings = Field(default_factory=SoundDesignSettings)
    lyrics: LyricsSettings = Field(default_factory=LyricsSettings)
    title: Optional[str] = None
    is_cinematic: bool = False
    scene_description: Optional[str] = None


class QuickGenerateRequest(BaseModel):
    """Simplified request for quick generation."""
    vibe: VibeCategoryEnum
    custom_vibe: Optional[str] = None
    style: MusicStyleEnum = MusicStyleEnum.INSTRUMENTAL


# ── Response Models ──────────────────────────────────────────────────────────

class GenerationJob(BaseModel):
    """Tracks the status of a generation request."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: GenerationStatus = GenerationStatus.QUEUED
    progress_message: str = "Preparing your composition..."
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    prompt_used: str = ""
    provider: ProviderType = ProviderType.NONE
    error_message: Optional[str] = None


class Creation(BaseModel):
    """A completed music creation with metadata."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = "Untitled Composition"
    vibe: str = ""
    style: str = ""
    emotional_direction: str = ""
    prompt_used: str = ""
    provider: str = ""
    audio_filename: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    is_favorite: bool = False
    generation_settings: dict = Field(default_factory=dict)
    scene_description: Optional[str] = None
    is_cinematic: bool = False


class CreationUpdate(BaseModel):
    """Update fields for a creation."""
    title: Optional[str] = None
    is_favorite: Optional[bool] = None


class ProviderStatus(BaseModel):
    """Status of a music generation provider."""
    provider: ProviderType
    configured: bool
    name: str
    description: str
    supports_vocals: bool
    max_duration_seconds: int
    is_free: bool
    note: str = ""


class GenerationPreview(BaseModel):
    """Prompt preview for when no provider is configured."""
    prompt: str
    provider_recommendation: str
    setup_instructions: str
    generation_settings: dict
