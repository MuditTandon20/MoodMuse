"""
MoodMuse Studio - Prompt Engine
Converts user questionnaire responses into detailed music generation prompts.
"""
from models import (
    MusicGenerationRequest,
    VibeCategoryEnum,
    MusicStyleEnum,
    EmotionalDirectionEnum,
    EnergyLevel,
    IntensityLevel,
    TempoLevel,
    AtmosphereType,
    VocalType,
)


# ── Vibe Descriptors ────────────────────────────────────────────────────────

VIBE_PROMPTS: dict[VibeCategoryEnum, str] = {
    VibeCategoryEnum.HEARTBREAK: "deeply emotional, melancholic, sorrowful, with a sense of loss and longing",
    VibeCategoryEnum.PEACEFUL: "calm, serene, tranquil, dreamy, with gentle flowing melodies",
    VibeCategoryEnum.ROMANTIC: "warm, tender, intimate, with soft romantic undertones and gentle harmonies",
    VibeCategoryEnum.DARK: "dark, mysterious, brooding, with tension and shadowy undertones",
    VibeCategoryEnum.VILLAIN: "menacing, powerful, dramatic, with a sense of dangerous authority and antihero energy",
    VibeCategoryEnum.EPIC: "grand, heroic, sweeping, with powerful crescendos and triumphant themes",
    VibeCategoryEnum.MOTIVATIONAL: "uplifting, inspiring, triumphant, with building energy and victorious melodies",
    VibeCategoryEnum.NOSTALGIC: "wistful, bittersweet, reminiscent, with vintage warmth and gentle sadness",
    VibeCategoryEnum.RAINY_NIGHT: "atmospheric, lonely, urban night ambiance, with rain-like textures and city melancholy",
    VibeCategoryEnum.SCIFI: "futuristic, electronic, otherworldly, with space-like synthesizers and digital textures",
    VibeCategoryEnum.FANTASY: "magical, adventurous, whimsical, with enchanting melodies and mystical atmosphere",
    VibeCategoryEnum.HORROR: "terrifying, suspenseful, eerie, with dissonant harmonies and creeping tension",
    VibeCategoryEnum.ANIME: "expressive, dynamic, emotionally dramatic, Japanese-inspired atmospheric music",
    VibeCategoryEnum.CINEMATIC: "emotionally climactic, film score quality, with dramatic builds and powerful resolution",
    VibeCategoryEnum.CUSTOM: "",
}

# ── Style Descriptors ────────────────────────────────────────────────────────

STYLE_PROMPTS: dict[MusicStyleEnum, str] = {
    MusicStyleEnum.INSTRUMENTAL: "instrumental background music",
    MusicStyleEnum.FULL_SONG: "full song with melodic structure",
    MusicStyleEnum.VOCAL_MELODY: "vocal melody composition",
    MusicStyleEnum.PIANO: "solo piano composition with expressive dynamics",
    MusicStyleEnum.ORCHESTRAL: "orchestral soundtrack with full ensemble",
    MusicStyleEnum.GUITAR: "guitar-based music with acoustic or electric guitar lead",
    MusicStyleEnum.ELECTRONIC: "electronic music with synthesizers and digital beats",
    MusicStyleEnum.LOFI: "lo-fi ambient music with warm textures and gentle beats",
    MusicStyleEnum.BOLLYWOOD: "Bollywood-inspired music with Indian melodic sensibilities",
    MusicStyleEnum.INDIE: "indie pop acoustic music with authentic organic sound",
    MusicStyleEnum.ROCK: "rock music with energetic guitars and driving rhythm",
    MusicStyleEnum.HYBRID: "hybrid fusion of multiple musical styles",
}

# ── Emotional Direction Descriptors ──────────────────────────────────────────

EMOTION_PROMPTS: dict[EmotionalDirectionEnum, str] = {
    EmotionalDirectionEnum.STAY: "maintaining a consistent emotional tone throughout",
    EmotionalDirectionEnum.INTENSIFY: "gradually building in emotional intensity",
    EmotionalDirectionEnum.NOSTALGIC: "evoking deep nostalgia and memory",
    EmotionalDirectionEnum.SUSPENSE: "building suspense and anticipation",
    EmotionalDirectionEnum.FREEDOM: "creating a sense of freedom and liberation",
    EmotionalDirectionEnum.UPLIFTING: "gradually becoming more uplifting and hopeful",
    EmotionalDirectionEnum.QUIET_TO_EPIC: "starting quietly and building to an epic climax",
    EmotionalDirectionEnum.PEACEFUL_END: "resolving to a peaceful, gentle conclusion",
    EmotionalDirectionEnum.CUSTOM: "",
}

# ── Sound Palette Mappings ───────────────────────────────────────────────────

SOUND_PALETTE_MAP: dict[str, str] = {
    "piano": "piano",
    "strings": "string ensemble",
    "guitar": "acoustic guitar",
    "synth": "synthesizer",
    "percussion": "percussion and drums",
    "flute": "flute",
    "ambient": "ambient pads and textures",
    "mixed": "mixed instrumentation",
}


def build_music_prompt(request: MusicGenerationRequest) -> str:
    """
    Convert a MusicGenerationRequest into a detailed text prompt
    suitable for MusicGen or similar text-to-music models.
    """
    parts: list[str] = []

    # 1. Core style
    style_desc = STYLE_PROMPTS.get(request.style, "instrumental music")
    parts.append(style_desc)

    # 2. Vibe/mood
    if request.vibe == VibeCategoryEnum.CUSTOM and request.custom_vibe:
        parts.append(f"with a {request.custom_vibe} mood")
    else:
        vibe_desc = VIBE_PROMPTS.get(request.vibe, "")
        if vibe_desc:
            parts.append(f"that is {vibe_desc}")

    # 3. Emotional direction
    if request.emotional_direction == EmotionalDirectionEnum.CUSTOM and request.custom_emotional_direction:
        parts.append(request.custom_emotional_direction)
    else:
        emotion_desc = EMOTION_PROMPTS.get(request.emotional_direction, "")
        if emotion_desc:
            parts.append(emotion_desc)

    # 4. Sound design parameters
    sd = request.sound_design

    # Energy & intensity
    energy_map = {
        EnergyLevel.LOW: "low energy, gentle",
        EnergyLevel.MEDIUM: "moderate energy",
        EnergyLevel.HIGH: "high energy, powerful",
    }
    intensity_map = {
        IntensityLevel.SUBTLE: "subtle and delicate",
        IntensityLevel.MODERATE: "moderately dynamic",
        IntensityLevel.DRAMATIC: "intensely dramatic",
    }
    parts.append(energy_map.get(sd.energy, ""))
    parts.append(intensity_map.get(sd.intensity, ""))

    # Tempo
    tempo_map = {
        TempoLevel.SLOW: "slow tempo",
        TempoLevel.MEDIUM: "medium tempo",
        TempoLevel.FAST: "fast tempo",
    }
    parts.append(tempo_map.get(sd.tempo, ""))

    # Atmosphere
    atmosphere_map = {
        AtmosphereType.INTIMATE: "intimate atmosphere",
        AtmosphereType.SPACIOUS: "spacious, wide atmosphere",
        AtmosphereType.DARK: "dark, moody atmosphere",
        AtmosphereType.WARM: "warm, inviting atmosphere",
        AtmosphereType.FUTURISTIC: "futuristic, sci-fi atmosphere",
        AtmosphereType.GRAND: "grand, majestic atmosphere",
    }
    parts.append(atmosphere_map.get(sd.atmosphere, ""))

    # Sound palette
    instruments = []
    for p in sd.sound_palette:
        if p in SOUND_PALETTE_MAP:
            instruments.append(SOUND_PALETTE_MAP[p])
    if instruments and "mixed instrumentation" not in instruments:
        parts.append(f"featuring {', '.join(instruments)}")

    # Vocals (MusicGen doesn't support vocals, but we include for prompt preview)
    if sd.vocals == VocalType.WORDLESS:
        parts.append("with wordless vocal harmonies")
    elif sd.vocals == VocalType.LYRICS:
        parts.append("with vocals")

    # 5. Cinematic scene description
    if request.is_cinematic and request.scene_description:
        parts.append(f"for a scene: {request.scene_description}")

    # 6. Quality markers
    parts.append("high quality, professional production")

    # Filter empty parts and join
    prompt = ", ".join(p for p in parts if p.strip())
    return prompt


def build_cinematic_prompt(scene: str, instruments: list[str] | None = None,
                           intensity: str = "moderate", ending: str = "peaceful") -> str:
    """
    Build a prompt specifically for cinematic BGM composition.
    """
    parts = [
        "cinematic film score, orchestral background music",
        f"for a scene depicting: {scene}",
    ]

    intensity_map = {
        "subtle": "with subtle, understated dynamics",
        "moderate": "with moderate dramatic intensity",
        "dramatic": "with powerful, sweeping dramatic intensity",
        "building": "starting subtle and building to dramatic intensity",
    }
    parts.append(intensity_map.get(intensity, intensity_map["moderate"]))

    ending_map = {
        "peaceful": "resolving peacefully",
        "epic": "building to an epic climax",
        "suspenseful": "ending with suspenseful tension",
        "bittersweet": "ending on a bittersweet note",
        "triumphant": "ending triumphantly",
        "fade_out": "gently fading out",
    }
    parts.append(ending_map.get(ending, ending_map["peaceful"]))

    if instruments:
        instrument_names = [SOUND_PALETTE_MAP.get(i, i) for i in instruments]
        parts.append(f"featuring {', '.join(instrument_names)}")

    parts.append("high quality, professional film score production")

    return ", ".join(parts)
