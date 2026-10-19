/**
 * MoodMuse Studio — Wizard Data Constants
 * All the categories, options, and defaults for the music creation wizard.
 */

export const VIBES = [
  { id: 'heartbreak', icon: '💔', label: 'Heartbreak', desc: 'Emotional sadness & loss' },
  { id: 'peaceful', icon: '🌙', label: 'Peaceful', desc: 'Dreamy & serene' },
  { id: 'romantic', icon: '🌹', label: 'Romantic', desc: 'Warm & tender' },
  { id: 'dark', icon: '🖤', label: 'Dark', desc: 'Mysterious & brooding' },
  { id: 'villain', icon: '😈', label: 'Villain Arc', desc: 'Antihero energy' },
  { id: 'epic', icon: '⚔️', label: 'Epic', desc: 'Heroic & grand' },
  { id: 'motivational', icon: '🔥', label: 'Motivational', desc: 'Triumphant & inspiring' },
  { id: 'nostalgic', icon: '📷', label: 'Nostalgic', desc: 'Bittersweet memories' },
  { id: 'rainy_night', icon: '🌧️', label: 'Rainy Night', desc: 'Lonely city vibes' },
  { id: 'scifi', icon: '🚀', label: 'Sci-Fi', desc: 'Futuristic sounds' },
  { id: 'fantasy', icon: '🧙', label: 'Fantasy', desc: 'Magical adventure' },
  { id: 'horror', icon: '👻', label: 'Horror', desc: 'Suspenseful & eerie' },
  { id: 'anime', icon: '🌸', label: 'Anime', desc: 'Japanese atmosphere' },
  { id: 'cinematic', icon: '🎬', label: 'Cinematic', desc: 'Film score climax' },
  { id: 'custom', icon: '✨', label: 'Custom Vibe', desc: 'Describe your own' },
];

export const STYLES = [
  { id: 'instrumental', icon: '🎼', label: 'Instrumental BGM', desc: 'Background music' },
  { id: 'full_song', icon: '🎤', label: 'Full Song', desc: 'With vocals*' },
  { id: 'vocal_melody', icon: '🎵', label: 'Vocal Melody', desc: 'Melody without lyrics*' },
  { id: 'piano', icon: '🎹', label: 'Piano', desc: 'Solo piano composition' },
  { id: 'orchestral', icon: '🎻', label: 'Orchestral', desc: 'Full ensemble soundtrack' },
  { id: 'guitar', icon: '🎸', label: 'Guitar-based', desc: 'Acoustic or electric' },
  { id: 'electronic', icon: '🎛️', label: 'Electronic', desc: 'Synth & digital beats' },
  { id: 'lofi', icon: '☕', label: 'Lo-Fi', desc: 'Ambient & chill' },
  { id: 'bollywood', icon: '🎭', label: 'Bollywood', desc: 'Indian-inspired' },
  { id: 'indie', icon: '🌻', label: 'Indie Pop', desc: 'Acoustic & organic' },
  { id: 'rock', icon: '🤘', label: 'Rock', desc: 'Energetic & driving' },
  { id: 'hybrid', icon: '🔀', label: 'Hybrid', desc: 'Multiple styles' },
];

export const EMOTIONS = [
  { id: 'stay', icon: '➡️', label: 'Stay in mood', desc: 'Keep the current feeling' },
  { id: 'intensify', icon: '📈', label: 'Intensify', desc: 'Make it more powerful' },
  { id: 'nostalgic', icon: '🕰️', label: 'Feel nostalgic', desc: 'Deep memories' },
  { id: 'suspense', icon: '⏳', label: 'Build suspense', desc: 'Tension & anticipation' },
  { id: 'freedom', icon: '🕊️', label: 'Create freedom', desc: 'Liberation & openness' },
  { id: 'uplifting', icon: '🌅', label: 'Become uplifting', desc: 'Gradually hopeful' },
  { id: 'quiet_to_epic', icon: '🌊', label: 'Quiet → Epic', desc: 'Dramatic crescendo' },
  { id: 'peaceful_end', icon: '🌿', label: 'End peacefully', desc: 'Gentle resolution' },
  { id: 'custom', icon: '🎯', label: 'Custom journey', desc: 'Describe your own' },
];

export const SOUND_PALETTE_OPTIONS = [
  { id: 'piano', label: '🎹 Piano' },
  { id: 'strings', label: '🎻 Strings' },
  { id: 'guitar', label: '🎸 Guitar' },
  { id: 'synth', label: '🎛️ Synth' },
  { id: 'percussion', label: '🥁 Percussion' },
  { id: 'flute', label: '🎶 Flute' },
  { id: 'ambient', label: '🌫️ Ambient' },
  { id: 'mixed', label: '🔀 Mixed' },
];

export const ATMOSPHERE_OPTIONS = [
  { id: 'intimate', label: 'Intimate' },
  { id: 'spacious', label: 'Spacious' },
  { id: 'dark', label: 'Dark' },
  { id: 'warm', label: 'Warm' },
  { id: 'futuristic', label: 'Futuristic' },
  { id: 'grand', label: 'Grand' },
];

export const CINEMATIC_SCENES = [
  { icon: '⚔️', label: 'A hero entering a battlefield' },
  { icon: '🌧️', label: 'Someone looking at a city during the rain' },
  { icon: '🚉', label: 'A bittersweet farewell at a railway station' },
  { icon: '😈', label: 'An antagonist revealing their true identity' },
  { icon: '🌅', label: 'A peaceful sunrise after a difficult journey' },
  { icon: '🪐', label: 'A mysterious discovery in outer space' },
  { icon: '🔍', label: 'A suspenseful investigation' },
  { icon: '🏆', label: 'A climactic victory' },
  { icon: '🌙', label: 'A quiet emotional ending' },
];

export const LYRIC_LANGUAGES = [
  { id: 'english', label: 'English' },
  { id: 'hindi', label: 'Hindi' },
  { id: 'hinglish', label: 'Hinglish' },
];

export const VIBE_GRADIENTS = {
  heartbreak: 'linear-gradient(135deg, #4a1a6b, #7c3aed, #1e1b4b)',
  peaceful: 'linear-gradient(135deg, #064e3b, #0d9488, #134e4a)',
  romantic: 'linear-gradient(135deg, #831843, #e11d48, #fb7185)',
  dark: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  villain: 'linear-gradient(135deg, #1a0a0a, #7f1d1d, #991b1b)',
  epic: 'linear-gradient(135deg, #78350f, #d97706, #fbbf24)',
  motivational: 'linear-gradient(135deg, #7c2d12, #ea580c, #fb923c)',
  nostalgic: 'linear-gradient(135deg, #44403c, #78716c, #a8a29e)',
  rainy_night: 'linear-gradient(135deg, #0c1445, #1e3a5f, #3b5998)',
  scifi: 'linear-gradient(135deg, #042f2e, #0891b2, #22d3ee)',
  fantasy: 'linear-gradient(135deg, #3b0764, #7e22ce, #c084fc)',
  horror: 'linear-gradient(135deg, #1c1917, #450a0a, #7f1d1d)',
  anime: 'linear-gradient(135deg, #831843, #ec4899, #f9a8d4)',
  cinematic: 'linear-gradient(135deg, #1e1b4b, #4338ca, #818cf8)',
  custom: 'linear-gradient(135deg, #374151, #6b7280, #9ca3af)',
};

export const DEFAULT_SOUND_DESIGN = {
  energy: 'medium',
  intensity: 'moderate',
  tempo: 'medium',
  sound_palette: ['mixed'],
  atmosphere: 'warm',
  duration_seconds: 15,
  vocals: 'none',
};

export const DEFAULT_LYRICS = {
  has_lyrics: false,
  user_lyrics: '',
  theme: '',
  language: 'english',
  perspective: '',
  mood: '',
};
