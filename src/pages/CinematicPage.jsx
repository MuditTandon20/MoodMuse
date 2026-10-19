import React, { useState, useCallback } from 'react';
import { Film, Sparkles, ChevronLeft, Copy, Check, ExternalLink } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import api from '../api';
import { CINEMATIC_SCENES, SOUND_PALETTE_OPTIONS, VIBE_GRADIENTS } from '../wizardData';

export default function CinematicPage() {
  const [sceneText, setSceneText] = useState('');
  const [selectedScene, setSelectedScene] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [intensity, setIntensity] = useState('moderate');
  const [ending, setEnding] = useState('peaceful');
  const [duration, setDuration] = useState(15);

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [promptPreview, setPromptPreview] = useState(null);
  const [copied, setCopied] = useState(false);

  const scene = sceneText || (selectedScene !== null ? CINEMATIC_SCENES[selectedScene].label : '');

  const toggleInstrument = (id) => {
    setInstruments(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!scene.trim()) return;
    setGenerating(true);
    setError('');
    setResult(null);
    setPromptPreview(null);

    try {
      const data = await api.generateCinematic({
        scene_description: scene,
        instruments: instruments.length > 0 ? instruments : null,
        intensity,
        ending,
        duration_seconds: duration,
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
  }, [scene, instruments, intensity, ending, duration]);

  const copyPrompt = () => {
    if (promptPreview?.prompt) {
      navigator.clipboard.writeText(promptPreview.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setSceneText('');
    setSelectedScene(null);
    setResult(null);
    setPromptPreview(null);
    setError('');
  };

  // Generating animation
  if (generating) {
    return (
      <div className="page-container">
        <div className="generating-animation">
          <div className="waveform-bars">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="waveform-bar" />
            ))}
          </div>
          <h2><span className="gradient-text">Composing Your Score</span></h2>
          <p style={{ marginTop: '0.5rem' }}>Crafting cinematic music for your scene...</p>
          <p style={{ fontSize: '0.8rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
            This may take 30–90 seconds
          </p>
        </div>
      </div>
    );
  }

  // Result
  if (result) {
    return (
      <div className="page-container" style={{ maxWidth: '700px' }}>
        <div className="text-center mb-lg" style={{ animation: 'slideUp 0.5s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎬</div>
          <h2><span className="gradient-text">Your Score is Ready!</span></h2>
          <p style={{ marginTop: '0.5rem' }}>{result.title}</p>
        </div>

        <AudioPlayer
          src={api.getAudioUrl(result.id)}
          title={result.title}
          subtitle="Cinematic BGM"
          gradient={VIBE_GRADIENTS.cinematic}
        />

        <div className="glass-card-static" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Scene Description</h4>
          <p style={{ color: 'var(--text-secondary)' }}>{result.scene_description}</p>
          <div className="prompt-preview" style={{ marginTop: '1rem' }}>
            <div className="input-label">Prompt Used</div>
            <div className="prompt-text">{result.prompt_used}</div>
          </div>
        </div>

        <div className="flex gap-md mt-lg justify-center">
          <button className="btn btn-primary btn-lg" onClick={reset}>
            <Film size={18} /> New Scene
          </button>
          <button className="btn btn-secondary btn-lg" onClick={handleGenerate}>
            🔄 Regenerate
          </button>
        </div>
      </div>
    );
  }

  // Prompt Preview
  if (promptPreview) {
    return (
      <div className="page-container" style={{ maxWidth: '700px' }}>
        <div className="setup-banner" style={{ animation: 'slideUp 0.5s ease' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚙️</div>
          <h3>Music Generation Setup Required</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Your cinematic prompt is ready! Configure a provider to generate actual music.
          </p>
          <div className="setup-steps" style={{ marginTop: '1rem' }}>
            <ol>
              <li>Get a free API token from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noreferrer">Hugging Face</a></li>
              <li>Add <code>HF_API_TOKEN=your_token</code> to <code>backend/.env</code></li>
              <li>Restart the backend server</li>
            </ol>
          </div>
        </div>

        <div className="glass-card-static" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
            <h4>Generated Prompt</h4>
            <button className="btn btn-ghost btn-sm" onClick={copyPrompt}>
              {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
            </button>
          </div>
          <div className="prompt-preview">
            <div className="prompt-text">{promptPreview.prompt}</div>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            💡 Copy and use with <a href="https://huggingface.co/spaces/facebook/MusicGen" target="_blank" rel="noreferrer">MusicGen <ExternalLink size={12} /></a>
          </p>
        </div>

        <div className="flex justify-center mt-lg">
          <button className="btn btn-primary btn-lg" onClick={reset}>
            <ChevronLeft size={18} /> Start Over
          </button>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="page-container">
      <div className="page-header">
        <h1><Film size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem' }} />
          <span className="gradient-text">Cinematic BGM Composer</span>
        </h1>
        <p className="subtitle">Create original movie-style background music for any scene</p>
      </div>

      {error && (
        <div className="setup-banner" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '2rem' }}>
          <p style={{ color: '#fca5a5' }}>❌ {error}</p>
        </div>
      )}

      {/* Scene Selection */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Describe Your Scene</h3>
          <p className="section-desc">Choose a preset or write your own scene description</p>
        </div>

        <div className="selection-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {CINEMATIC_SCENES.map((s, i) => (
            <div
              key={i}
              className={`selection-card ${selectedScene === i ? 'selected' : ''}`}
              onClick={() => { setSelectedScene(i); setSceneText(''); }}
            >
              <span className="card-icon">{s.icon}</span>
              <div className="card-label" style={{ fontSize: '0.8rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', maxWidth: '600px' }}>
          <label className="input-label">Or describe a custom scene</label>
          <textarea
            className="input-field"
            placeholder="e.g., Two old friends meeting after years at a quiet café, rain gently tapping the windows..."
            value={sceneText}
            onChange={(e) => { setSceneText(e.target.value); setSelectedScene(null); }}
            rows={3}
          />
        </div>
      </div>

      {/* Emotional Settings */}
      <div className="section" style={{ maxWidth: '600px' }}>
        <div className="section-header">
          <h3 className="section-title">Emotional Settings</h3>
        </div>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Intensity */}
          <div className="slider-container">
            <span className="input-label">Intensity</span>
            <div className="slider-track">
              {[
                { id: 'subtle', label: '🤫 Subtle' },
                { id: 'moderate', label: '🎭 Moderate' },
                { id: 'dramatic', label: '💥 Dramatic' },
                { id: 'building', label: '📈 Building' },
              ].map(opt => (
                <div
                  key={opt.id}
                  className={`slider-option ${intensity === opt.id ? 'active' : ''}`}
                  onClick={() => setIntensity(opt.id)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Ending */}
          <div className="slider-container">
            <span className="input-label">Ending</span>
            <div className="chip-group">
              {[
                { id: 'peaceful', label: '🌿 Peaceful' },
                { id: 'epic', label: '⚔️ Epic' },
                { id: 'suspenseful', label: '⏳ Suspenseful' },
                { id: 'bittersweet', label: '💔 Bittersweet' },
                { id: 'triumphant', label: '🏆 Triumphant' },
                { id: 'fade_out', label: '🌅 Fade Out' },
              ].map(opt => (
                <div
                  key={opt.id}
                  className={`chip ${ending === opt.id ? 'active' : ''}`}
                  onClick={() => setEnding(opt.id)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Instruments */}
          <div className="slider-container">
            <span className="input-label">Instruments (optional)</span>
            <div className="chip-group">
              {SOUND_PALETTE_OPTIONS.filter(o => o.id !== 'mixed').map(opt => (
                <div
                  key={opt.id}
                  className={`chip ${instruments.includes(opt.id) ? 'active' : ''}`}
                  onClick={() => toggleInstrument(opt.id)}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="slider-container">
            <span className="input-label">Duration</span>
            <div className="slider-track">
              {[5, 10, 15, 20, 30].map(val => (
                <div
                  key={val}
                  className={`slider-option ${duration === val ? 'active' : ''}`}
                  onClick={() => setDuration(val)}
                >
                  {val}s
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate */}
      <div className="text-center mt-xl">
        <button
          className="btn btn-primary btn-lg"
          disabled={!scene.trim()}
          onClick={handleGenerate}
        >
          <Sparkles size={18} />
          Compose Score
        </button>
      </div>
    </div>
  );
}
