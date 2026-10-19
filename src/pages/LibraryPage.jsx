import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Trash2, Edit3, Check, X, RefreshCw, Sparkles, Music,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AudioPlayer from '../components/AudioPlayer';
import api from '../api';
import { VIBE_GRADIENTS } from '../wizardData';

export default function LibraryPage() {
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [activePlayer, setActivePlayer] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchCreations = useCallback(async () => {
    try {
      const data = await api.getCreations();
      setCreations(data.creations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreations();
  }, [fetchCreations]);

  const toggleFavorite = async (id, currentFav) => {
    try {
      const updated = await api.updateCreation(id, { is_favorite: !currentFav });
      setCreations(prev =>
        prev.map(c => c.id === id ? { ...c, is_favorite: updated.is_favorite } : c)
      );
    } catch (err) {
      console.error('Failed to update favorite:', err);
    }
  };

  const startEdit = (id, currentTitle) => {
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = async (id) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await api.updateCreation(id, { title: editTitle.trim() });
      setCreations(prev =>
        prev.map(c => c.id === id ? { ...c, title: updated.title } : c)
      );
    } catch (err) {
      console.error('Failed to rename:', err);
    }
    setEditingId(null);
  };

  const deleteCreation = async (id) => {
    try {
      await api.deleteCreation(id);
      setCreations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
    setDeleteConfirm(null);
  };

  const favorites = creations.filter(c => c.is_favorite);
  const others = creations.filter(c => !c.is_favorite);

  if (loading) {
    return (
      <div className="page-container text-center" style={{ paddingTop: '4rem' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading your creations...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1><span className="gradient-text">My Creations</span></h1>
        <p className="subtitle">{creations.length} composition{creations.length !== 1 ? 's' : ''} in your library</p>
      </div>

      {error && (
        <div className="setup-banner" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: '2rem' }}>
          <p style={{ color: '#fca5a5' }}>❌ {error}</p>
          <button className="btn btn-ghost btn-sm mt-md" onClick={fetchCreations}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {creations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎵</div>
          <h3>No compositions yet</h3>
          <p>Start creating original music from your mood and imagination.</p>
          <Link to="/" className="btn btn-primary btn-lg" style={{ textDecoration: 'none' }}>
            <Sparkles size={18} />
            Create Your First
          </Link>
        </div>
      ) : (
        <>
          {/* Favorites Section */}
          {favorites.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h3 className="section-title">
                  <Heart size={18} style={{ display: 'inline', fill: '#ef4444', color: '#ef4444', marginRight: '0.5rem' }} />
                  Favorites
                </h3>
              </div>
              <div className="creations-grid">
                {favorites.map(creation => (
                  <CreationCard
                    key={creation.id}
                    creation={creation}
                    editingId={editingId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onToggleFavorite={toggleFavorite}
                    onDelete={(id) => setDeleteConfirm(id)}
                    activePlayer={activePlayer}
                    setActivePlayer={setActivePlayer}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Creations */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">
                {favorites.length > 0 ? 'All Compositions' : ''}
              </h3>
            </div>
            <div className="creations-grid">
              {(favorites.length > 0 ? others : creations).map(creation => (
                <CreationCard
                  key={creation.id}
                  creation={creation}
                  editingId={editingId}
                  editTitle={editTitle}
                  setEditTitle={setEditTitle}
                  onEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onToggleFavorite={toggleFavorite}
                  onDelete={(id) => setDeleteConfirm(id)}
                  activePlayer={activePlayer}
                  setActivePlayer={setActivePlayer}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '0.75rem' }}>Delete Composition?</h3>
            <p style={{ marginBottom: '1.5rem' }}>This will permanently delete the composition and its audio file. This cannot be undone.</p>
            <div className="flex gap-md">
              <button className="btn btn-danger" onClick={() => deleteCreation(deleteConfirm)}>
                <Trash2 size={16} /> Delete
              </button>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreationCard({
  creation, editingId, editTitle, setEditTitle,
  onEdit, onSaveEdit, onCancelEdit, onToggleFavorite,
  onDelete, activePlayer, setActivePlayer,
}) {
  const isEditing = editingId === creation.id;
  const isPlaying = activePlayer === creation.id;
  const gradient = VIBE_GRADIENTS[creation.vibe] || VIBE_GRADIENTS.custom;
  const date = new Date(creation.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="creation-card">
      {/* Artwork */}
      <div className="creation-artwork" style={{ background: gradient }}>
        <div className="creation-artwork-bg">
          {creation.is_cinematic ? '🎬' : '🎵'}
        </div>
      </div>

      {/* Body */}
      <div className="creation-body">
        {/* Title */}
        {isEditing ? (
          <div className="flex gap-sm items-center mb-md">
            <input
              type="text"
              className="input-field"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(creation.id)}
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="btn btn-ghost btn-icon" onClick={() => onSaveEdit(creation.id)}>
              <Check size={16} />
            </button>
            <button className="btn btn-ghost btn-icon" onClick={onCancelEdit}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="creation-title">{creation.title}</div>
        )}

        {/* Meta Tags */}
        <div className="creation-meta">
          <span className="meta-tag">{creation.vibe}</span>
          <span className="meta-tag">{creation.style}</span>
          <span className="meta-tag">{date}</span>
          {creation.duration_seconds && (
            <span className="meta-tag">{creation.duration_seconds}s</span>
          )}
        </div>

        {/* Player Toggle */}
        {isPlaying && creation.audio_url && (
          <div style={{ marginBottom: '1rem' }}>
            <AudioPlayer
              src={api.getAudioUrl(creation.id)}
              title={creation.title}
              subtitle={`${creation.vibe} · ${creation.style}`}
              gradient={gradient}
            />
          </div>
        )}

        {/* Actions */}
        <div className="creation-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setActivePlayer(isPlaying ? null : creation.id)}
          >
            {isPlaying ? '⏹️ Close' : '▶️ Play'}
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => onToggleFavorite(creation.id, creation.is_favorite)}
            title={creation.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={16}
              fill={creation.is_favorite ? '#ef4444' : 'none'}
              color={creation.is_favorite ? '#ef4444' : 'var(--text-muted)'}
            />
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => onEdit(creation.id, creation.title)}
            title="Rename"
          >
            <Edit3 size={16} />
          </button>

          <button
            className="btn btn-ghost btn-icon"
            onClick={() => onDelete(creation.id)}
            title="Delete"
            style={{ color: 'var(--text-muted)' }}
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Prompt Preview */}
        {creation.prompt_used && (
          <details style={{ marginTop: '0.75rem' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              View generation prompt
            </summary>
            <div className="prompt-preview" style={{ marginTop: '0.5rem' }}>
              <div className="prompt-text" style={{ fontSize: '0.75rem' }}>{creation.prompt_used}</div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
