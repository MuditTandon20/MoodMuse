import React, { useState, useCallback } from 'react';
import { Check, ChevronRight, ChevronLeft, Zap, Sparkles, Copy, ExternalLink } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import api from '../api';
import {
  VIBES, STYLES, EMOTIONS, SOUND_PALETTE_OPTIONS,
  ATMOSPHERE_OPTIONS, LYRIC_LANGUAGES,
  VIBE_GRADIENTS, DEFAULT_SOUND_DESIGN, DEFAULT_LYRICS,
} from '../wizardData';

const TOTAL_STEPS = 5;

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [quickMode, setQuickMode] = useState(false);

  // Wizard state
  const [vibe, setVibe] = useState('');
  const [customVibe, setCustomVibe] = useState('');
  const [style, setStyle] = useState('');
  const [emotion, setEmotion] = useState('');
  const [customEmotion, setCustomEmotion] = useState('');
  const [soundDesign, setSoundDesign] = useState({ ...DEFAULT_SOUND_DESIGN });
  const [lyrics, setLyrics] = useState({ ...DEFAULT_LYRICS });
  const [title, setTitle] = useState('');

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [promptPreview, setPromptPreview] = useState(null);
  const [copied, setCopied] = useState(false);

  const updateSoundDesign = (key, value) => {
    setSoundDesign(prev => ({ ...prev, [key]: value }));
  };

  const toggleSoundPalette = (id) => {
    setSoundDesign(prev => {
      let palette = [...prev.sound_palette];
      if (id === 'mixed') {
        palette = ['mixed'];
      } else {
        palette = palette.filter(p => p !== 'mixed');
        if (palette.includes(id)) {
          palette = palette.filter(p => p !== id);
        } else {
          palette.push(id);
        }
        if (palette.length === 0) palette = ['mixed'];
      }
      return { ...prev, sound_palette: palette };
    });
  };

  const canProceed = () => {
    if (step === 1) return !!vibe && (vibe !== 'custom' || customVibe.trim());
    if (step === 2) return !!style;
    return true; // Steps 3-5 have defaults
  };

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError('');
    setResult(null);
    setPromptPreview(null);

    const request = {
      vibe: vibe || 'peaceful',
      custom_vibe: vibe === 'custom' ? customVibe : null,
      style: style || 'instrumental',
      emotional_direction: emotion || 'stay',
      custom_emotional_direction: emotion === 'custom' ? customEmotion : null,
      sound_design: soundDesign,
      lyrics: lyrics,
      title: title || null,
      is_cinematic: false,
    };

    try {
      const data = await api.generateMusic(request);

      if (data.status === 'no_provider') {
        setPromptPreview(data.preview);
      } else if (data.status === 'completed') {
        setResult(data.creation);
      } else if (data.status === 'failed') {
        setError(data.job?.error_message || 'Generation failed. Please try again.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }, [vibe, customVibe, style, emotion, customEmotion, soundDesign, lyrics, title]);

  const handleQuickGenerate = useCallback(async () => {
    if (!vibe) return;
    setGenerating(true);
    setError('');
    setResult(null);
    setPromptPreview(null);

    try {
      const data = await api.quickGenerate({
        vibe: vibe,
        custom_vibe: vibe === 'custom' ? customVibe : null,
        style: style || 'instrumental',
      });

      if (data.status === 'no_provider') {
        setPromptPreview(data.preview);
      } else if (data.status === 'completed') {
        setResult(data.creation);
      } else if (data.status === 'failed') {
        setError(data.job?.error_message || 'Generation failed.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }, [vibe, customVibe, style]);

  const copyPrompt = () => {
    if (promptPreview?.prompt) {
      navigator.clipboard.writeText(promptPreview.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setVibe('');
    setCustomVibe('');
    setStyle('');
    setEmotion('');
    setCustomEmotion('');
    setSoundDesign({ ...DEFAULT_SOUND_DESIGN });
    setLyrics({ ...DEFAULT_LYRICS });
    setTitle('');
    setResult(null);
    setError('');
    setPromptPreview(null);
  };

  // ── Render Generating State ──
  if (generating) {
    return (
      <div className="page-container">
        <div className="generating-animation">
          <div className="waveform-bars">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="waveform-bar" />
            ))}
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>
            <span className="gradient-text">Composing Your Music</span>
          </h2>
          <p style={{ fontSize: '0.95rem' }}>
            The AI is crafting an original composition based on your preferences...
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
            This may take 30–90 seconds depending on server load
          </p>
        </div>
      </div>
    );
  }

  // ── Render Result ──
  if (result) {
    return (
      <div className="page-container" style={{ maxWidth: '700px' }}>
        <div className="text-center mb-lg" style={{ animation: 'slideUp 0.5s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2><span className="gradient-text">Your Composition is Ready!</span></h2>
          <p style={{ marginTop: '0.5rem' }}>{result.title}</p>
        </div>

        <AudioPlayer
          src={api.getAudioUrl(result.id)}
          title={result.title}
          subtitle={`${result.vibe} · ${result.style}`}
          gradient={VIBE_GRADIENTS[result.vibe]}
        />

        <div className="glass-card-static" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.75rem' }}>Generation Details</h4>
          <div className="creation-meta">
            <span className="meta-tag">🎨 {result.vibe}</span>
            <span className="meta-tag">🎵 {result.style}</span>
            <span className="meta-tag">💫 {result.emotional_direction}</span>
            {result.provider && <span className="meta-tag">🤖 {result.provider}</span>}
          </div>
          <div className="prompt-preview" style={{ marginTop: '1rem' }}>
            <div className="input-label">Prompt Used</div>
            <div className="prompt-text">{result.prompt_used}</div>
          </div>
        </div>

        <div className="flex gap-md mt-lg" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={resetWizard}>
            <Sparkles size={18} />
            Create Another
          </button>
          <button className="btn btn-secondary btn-lg" onClick={handleGenerate}>
            🔄 Regenerate
          </button>
        </div>
      </div>
    );
  }

  // ── Render Prompt Preview (No Provider) ──
  if (promptPreview) {
    return (
      <div className="page-container" style={{ maxWidth: '700px' }}>
        <div className="setup-banner" style={{ animation: 'slideUp 0.5s ease' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
          <h3>Music Generation Setup Required</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Your prompt has been generated! To create actual music, you need to configure an AI provider.
          </p>

          <div className="setup-steps" style={{ marginTop: '1.5rem' }}>
            <ol>
              <li>Get a free API token from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">Hugging Face</a></li>
              <li>Create a <code>.env</code> file in the <code>backend/</code> directory</li>
              <li>Add: <code>HF_API_TOKEN=your_token_here</code></li>
              <li>Restart the backend server</li>
            </ol>
          </div>
        </div>

        <div className="glass-card-static" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
            <h4>Your Generated Prompt</h4>
            <button className="btn btn-ghost btn-sm" onClick={copyPrompt}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <div className="prompt-preview">
            <div className="prompt-text">{promptPreview.prompt}</div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            💡 You can copy this prompt and use it with any music generation service like{' '}
            <a href="https://huggingface.co/spaces/facebook/MusicGen" target="_blank" rel="noreferrer">MusicGen on Hugging Face <ExternalLink size={12} /></a>
          </p>
        </div>

        <div className="flex gap-md mt-lg" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={resetWizard}>
            <ChevronLeft size={18} />
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // ── Render Wizard Steps ──
  return (
    <div className="page-container">
      <div className="page-header">
        <h1><span className="gradient-text">MoodMuse Studio</span></h1>
        <p className="subtitle">Create original AI-generated music from your mood and imagination</p>

        <div className="flex gap-md justify-center mt-lg">
          <button
            className={`btn ${!quickMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setQuickMode(false)}
          >
            🎨 Full Wizard
          </button>
          <button
            className={`btn ${quickMode ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setQuickMode(true)}
          >
            <Zap size={14} /> Quick Create
          </button>
        </div>
      </div>

      {error && (
        <div className="setup-banner" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '2rem' }}>
          <p style={{ color: '#fca5a5' }}>❌ {error}</p>
        </div>
      )}

      {/* Quick Mode */}
      {quickMode ? (
        <div className="animate-slide-in">
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">Choose Your Vibe</h3>
              <p className="section-desc">Pick a mood and we'll handle the rest</p>
            </div>
            <div className="selection-grid">
              {VIBES.map(v => (
                <div
                  key={v.id}
                  className={`selection-card ${vibe === v.id ? 'selected' : ''}`}
                  onClick={() => setVibe(v.id)}
                  style={vibe === v.id ? { background: VIBE_GRADIENTS[v.id], border: 'none' } : {}}
                >
                  <span className="card-icon">{v.icon}</span>
                  <div className="card-label">{v.label}</div>
                </div>
              ))}
            </div>
            {vibe === 'custom' && (
              <div style={{ marginTop: '1rem', maxWidth: '400px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Describe your vibe..."
                  value={customVibe}
                  onChange={(e) => setCustomVibe(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="text-center mt-xl">
            <button
              className="btn btn-primary btn-lg"
              disabled={!vibe || (vibe === 'custom' && !customVibe.trim())}
              onClick={handleQuickGenerate}
            >
              <Zap size={18} />
              Generate Music Instantly
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Wizard Progress */}
          <div className="wizard-progress">
            {[1, 2, 3, 4, 5].map((s, i) => (
              <React.Fragment key={s}>
                <div className="wizard-step">
                  <div
                    className={`step-circle ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
                    onClick={() => s < step && setStep(s)}
                    style={{ cursor: s < step ? 'pointer' : 'default' }}
                  >
                    {step > s ? <Check size={16} /> : s}
                  </div>
                  <span className={`step-label ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
                    {['Vibe', 'Style', 'Emotion', 'Sound', 'Lyrics'][i]}
                  </span>
                </div>
                {i < 4 && <div className={`step-connector ${step > s ? 'completed' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          <div className="animate-slide-in" key={step}>
            {step === 1 && <StepVibe vibe={vibe} setVibe={setVibe} customVibe={customVibe} setCustomVibe={setCustomVibe} />}
            {step === 2 && <StepStyle style={style} setStyle={setStyle} />}
            {step === 3 && <StepEmotion emotion={emotion} setEmotion={setEmotion} customEmotion={customEmotion} setCustomEmotion={setCustomEmotion} />}
            {step === 4 && <StepSoundDesign soundDesign={soundDesign} updateSoundDesign={updateSoundDesign} toggleSoundPalette={toggleSoundPalette} />}
            {step === 5 && <StepLyrics lyrics={lyrics} setLyrics={setLyrics} style={style} title={title} setTitle={setTitle} />}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-xl" style={{ maxWidth: '600px', margin: '2rem auto 0' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              <ChevronLeft size={16} /> Back
            </button>

            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Step {step} of {TOTAL_STEPS}
            </span>

            {step < TOTAL_STEPS ? (
              <button
                className="btn btn-primary"
                onClick={() => setStep(s => Math.min(TOTAL_STEPS, s + 1))}
                disabled={!canProceed()}
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGenerate}
                disabled={!vibe}
              >
                <Sparkles size={18} />
                Generate Music
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Step Components ──────────────────────────────────────────────────────

function StepVibe({ vibe, setVibe, customVibe, setCustomVibe }) {
  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">Step 1 — Choose Your Vibe</h3>
        <p className="section-desc">What mood should your music capture?</p>
      </div>
      <div className="selection-grid">
        {VIBES.map(v => (
          <div
            key={v.id}
            className={`selection-card ${vibe === v.id ? 'selected' : ''}`}
            onClick={() => setVibe(v.id)}
            style={vibe === v.id ? { background: VIBE_GRADIENTS[v.id], border: 'none' } : {}}
          >
            <span className="card-icon">{v.icon}</span>
            <div className="card-label">{v.label}</div>
            <div className="card-desc">{v.desc}</div>
          </div>
        ))}
      </div>
      {vibe === 'custom' && (
        <div style={{ marginTop: '1.5rem', maxWidth: '500px' }}>
          <label className="input-label">Describe your custom vibe</label>
          <textarea
            className="input-field"
            placeholder="e.g., A misty morning in an old village with distant church bells..."
            value={customVibe}
            onChange={(e) => setCustomVibe(e.target.value)}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

function StepStyle({ style, setStyle }) {
  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">Step 2 — Music Style</h3>
        <p className="section-desc">What should the music sound like?</p>
      </div>
      <div className="selection-grid">
        {STYLES.map(s => (
          <div
            key={s.id}
            className={`selection-card ${style === s.id ? 'selected' : ''}`}
            onClick={() => setStyle(s.id)}
          >
            <span className="card-icon">{s.icon}</span>
            <div className="card-label">{s.label}</div>
            <div className="card-desc">{s.desc}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
        * Vocal options require a provider that supports vocals. MusicGen generates instrumental music.
      </p>
    </div>
  );
}

function StepEmotion({ emotion, setEmotion, customEmotion, setCustomEmotion }) {
  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">Step 3 — Emotional Direction</h3>
        <p className="section-desc">What should the music express?</p>
      </div>
      <div className="selection-grid">
        {EMOTIONS.map(e => (
          <div
            key={e.id}
            className={`selection-card ${emotion === e.id ? 'selected' : ''}`}
            onClick={() => setEmotion(e.id)}
          >
            <span className="card-icon">{e.icon}</span>
            <div className="card-label">{e.label}</div>
            <div className="card-desc">{e.desc}</div>
          </div>
        ))}
      </div>
      {emotion === 'custom' && (
        <div style={{ marginTop: '1.5rem', maxWidth: '500px' }}>
          <label className="input-label">Describe your emotional journey</label>
          <textarea
            className="input-field"
            placeholder="e.g., Start with sadness, build tension, then release into hopeful warmth..."
            value={customEmotion}
            onChange={(e) => setCustomEmotion(e.target.value)}
            rows={3}
          />
        </div>
      )}
    </div>
  );
}

function StepSoundDesign({ soundDesign, updateSoundDesign, toggleSoundPalette }) {
  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">Step 4 — Sound Design</h3>
        <p className="section-desc">Fine-tune the sonic character (all optional)</p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
        {/* Energy */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="input-label">Energy</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{soundDesign.energy}</span>
          </div>
          <div className="slider-track">
            {['low', 'medium', 'high'].map(val => (
              <div
                key={val}
                className={`slider-option ${soundDesign.energy === val ? 'active' : ''}`}
                onClick={() => updateSoundDesign('energy', val)}
              >
                {val === 'low' ? '🌊 Low' : val === 'medium' ? '⚡ Medium' : '🔥 High'}
              </div>
            ))}
          </div>
        </div>

        {/* Intensity */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="input-label">Intensity</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{soundDesign.intensity}</span>
          </div>
          <div className="slider-track">
            {['subtle', 'moderate', 'dramatic'].map(val => (
              <div
                key={val}
                className={`slider-option ${soundDesign.intensity === val ? 'active' : ''}`}
                onClick={() => updateSoundDesign('intensity', val)}
              >
                {val === 'subtle' ? '🤫 Subtle' : val === 'moderate' ? '🎭 Moderate' : '💥 Dramatic'}
              </div>
            ))}
          </div>
        </div>

        {/* Tempo */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="input-label">Tempo</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{soundDesign.tempo}</span>
          </div>
          <div className="slider-track">
            {['slow', 'medium', 'fast'].map(val => (
              <div
                key={val}
                className={`slider-option ${soundDesign.tempo === val ? 'active' : ''}`}
                onClick={() => updateSoundDesign('tempo', val)}
              >
                {val === 'slow' ? '🐢 Slow' : val === 'medium' ? '🚶 Medium' : '🏃 Fast'}
              </div>
            ))}
          </div>
        </div>

        {/* Atmosphere */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="input-label">Atmosphere</span>
          </div>
          <div className="chip-group">
            {ATMOSPHERE_OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`chip ${soundDesign.atmosphere === opt.id ? 'active' : ''}`}
                onClick={() => updateSoundDesign('atmosphere', opt.id)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        {/* Sound Palette */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="input-label">Sound Palette</span>
          </div>
          <div className="chip-group">
            {SOUND_PALETTE_OPTIONS.map(opt => (
              <div
                key={opt.id}
                className={`chip ${soundDesign.sound_palette.includes(opt.id) ? 'active' : ''}`}
                onClick={() => toggleSoundPalette(opt.id)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="input-label">Duration</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-accent)' }}>{soundDesign.duration_seconds}s</span>
          </div>
          <div className="slider-track">
            {[5, 10, 15, 20, 30].map(val => (
              <div
                key={val}
                className={`slider-option ${soundDesign.duration_seconds === val ? 'active' : ''}`}
                onClick={() => updateSoundDesign('duration_seconds', val)}
              >
                {val}s
              </div>
            ))}
          </div>
        </div>

        {/* Vocals */}
        <div className="slider-container">
          <div className="slider-header">
            <span className="input-label">Vocals</span>
          </div>
          <div className="slider-track">
            {[
              { id: 'none', label: '🎼 No Vocals' },
              { id: 'wordless', label: '🗣️ Wordless' },
              { id: 'lyrics', label: '🎤 With Lyrics*' },
            ].map(opt => (
              <div
                key={opt.id}
                className={`slider-option ${soundDesign.vocals === opt.id ? 'active' : ''}`}
                onClick={() => updateSoundDesign('vocals', opt.id)}
              >
                {opt.label}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            * Lyrics require a provider that supports vocal generation
          </p>
        </div>
      </div>
    </div>
  );
}

function StepLyrics({ lyrics, setLyrics, style, title, setTitle }) {
  const needsLyrics = ['full_song', 'vocal_melody'].includes(style);

  const updateLyric = (key, value) => {
    setLyrics(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">Step 5 — Final Touches</h3>
        <p className="section-desc">Name your creation and add lyrics if needed</p>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '600px' }}>
        {/* Title */}
        <div>
          <label className="input-label">Composition Title (optional)</label>
          <input
            type="text"
            className="input-field"
            placeholder="Give your creation a name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {needsLyrics && (
          <>
            <div>
              <label className="input-label">Lyrics Mode</label>
              <div className="slider-track">
                <div
                  className={`slider-option ${!lyrics.has_lyrics ? 'active' : ''}`}
                  onClick={() => updateLyric('has_lyrics', false)}
                >
                  🎼 Instrumental
                </div>
                <div
                  className={`slider-option ${lyrics.has_lyrics ? 'active' : ''}`}
                  onClick={() => updateLyric('has_lyrics', true)}
                >
                  ✍️ Add Lyrics
                </div>
              </div>
            </div>

            {lyrics.has_lyrics && (
              <>
                <div>
                  <label className="input-label">Language</label>
                  <div className="chip-group">
                    {LYRIC_LANGUAGES.map(lang => (
                      <div
                        key={lang.id}
                        className={`chip ${lyrics.language === lang.id ? 'active' : ''}`}
                        onClick={() => updateLyric('language', lang.id)}
                      >
                        {lang.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">Lyrical Theme</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g., lost love, freedom, new beginnings..."
                    value={lyrics.theme || ''}
                    onChange={(e) => updateLyric('theme', e.target.value)}
                  />
                </div>

                <div>
                  <label className="input-label">Your Lyrics (optional — leave empty to auto-generate)</label>
                  <textarea
                    className="input-field"
                    placeholder="Write your own lyrics here, or leave empty for AI-generated lyrics..."
                    value={lyrics.user_lyrics || ''}
                    onChange={(e) => updateLyric('user_lyrics', e.target.value)}
                    rows={6}
                  />
                </div>

                <div>
                  <label className="input-label">Storytelling Perspective</label>
                  <div className="chip-group">
                    {['First person', 'Second person', 'Third person', 'Narrative'].map(p => (
                      <div
                        key={p}
                        className={`chip ${lyrics.perspective === p ? 'active' : ''}`}
                        onClick={() => updateLyric('perspective', p)}
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {!needsLyrics && (
          <div className="glass-card-static" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              🎼 Your selected style is instrumental. If you want lyrics, go back and choose "Full Song" or "Vocal Melody".
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
