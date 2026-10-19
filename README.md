# 🎵 MoodMuse Studio

> **AI-Powered Music Generation from Mood & Emotion**

MoodMuse Studio is a full-stack AI application that generates original instrumental music, soundtrack themes, and cinematic climaxes based on emotional moods, visual scene descriptions, and interactive questionnaires.

---

## ✨ Features

- **Multi-Step Music Creation Wizard**:
  - **Mood & Vibe Selection**: Heartbreak, Euphoria, Cyberpunk, Cinematic Climax, Lo-Fi, and custom natural language prompts.
  - **Sound & Arrangement**: Instrumentation, tempo (BPM), structure, key/scale, and energy curve.
  - **Style & Genre Hybridization**: Blend orchestral, synthwave, ambient, and cinematic styles.
- **Cinematic Scene Scorer**:
  - Enter movie scene descriptions (e.g. *"Rainy Tokyo rooftop chase"*, *"Spacewalk into black hole"*) to craft bespoke film music cues.
- **Real AI Generation & Audio Player**:
  - Hugging Face Inference API (Meta MusicGen) & Replicate support.
  - Interactive waveform audio player, volume control, scrubbing, and download.
- **Creation Library**:
  - Saved library of tracks with metadata, mood tags, and prompt breakdowns.

---

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS / Vanilla CSS, Lucide Icons, Wavesurfer.js
- **Backend**: FastAPI, Uvicorn, Python 3.10+
- **AI Models**: Meta MusicGen via Hugging Face Inference API / Replicate

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3.10+](https://www.python.org/)
- Hugging Face API Token (Free): [Hugging Face Settings](https://huggingface.co/settings/tokens)

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # Add your HF_API_TOKEN
python main.py
```
Backend runs at `http://localhost:8000`.

### 3. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.
