/**
 * MoodMuse Studio — API Client
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = 'http://localhost:8000/api';

class MoodMuseAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Cannot connect to MoodMuse server. Make sure the backend is running on port 8000.');
      }
      throw err;
    }
  }

  async getHealth() {
    const res = await this.request('/health');
    return res.json();
  }

  async getProviders() {
    const res = await this.request('/providers');
    return res.json();
  }

  async generateMusic(requestData) {
    const res = await this.request('/generate', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return res.json();
  }

  async quickGenerate(requestData) {
    const res = await this.request('/generate/quick', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return res.json();
  }

  async generateCinematic({ scene_description, instruments, intensity, ending, duration_seconds }) {
    const params = new URLSearchParams({
      scene_description,
      intensity: intensity || 'moderate',
      ending: ending || 'peaceful',
      duration_seconds: String(duration_seconds || 15),
    });
    if (instruments?.length) {
      instruments.forEach(i => params.append('instruments', i));
    }
    const res = await this.request(`/generate/cinematic?${params}`, {
      method: 'POST',
    });
    return res.json();
  }

  async previewPrompt(requestData) {
    const res = await this.request('/prompt-preview', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return res.json();
  }

  getAudioUrl(jobId) {
    return `${API_BASE}/audio/${jobId}`;
  }

  async getCreations() {
    const res = await this.request('/creations');
    return res.json();
  }

  async getCreation(id) {
    const res = await this.request(`/creations/${id}`);
    return res.json();
  }

  async updateCreation(id, data) {
    const res = await this.request(`/creations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async deleteCreation(id) {
    const res = await this.request(`/creations/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  async getJobStatus(jobId) {
    const res = await this.request(`/jobs/${jobId}`);
    return res.json();
  }
}

export const api = new MoodMuseAPI();
export default api;
