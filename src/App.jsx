import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CreatePage from './pages/CreatePage';
import CinematicPage from './pages/CinematicPage';
import LibraryPage from './pages/LibraryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<CreatePage />} />
          <Route path="/cinematic" element={<CinematicPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
      }}>
        <p>MoodMuse Studio — AI Music Generation from Mood & Emotion</p>
        <p style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
          Music generated using Meta's MusicGen via Hugging Face. Generated audio is for personal use.
          Commercial rights depend on your provider's licensing terms.
        </p>
      </footer>
    </BrowserRouter>
  );
}
