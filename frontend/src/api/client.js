/**
 * Axios API Client
 * ================
 * Centralized HTTP client for all backend communications.
 */
import axios from 'axios';

let activeBackendUrl = null;

/**
 * Automatically discovers and connects to the active healthy backend.
 */
export const autoDiscoverBackend = async () => {
  if (activeBackendUrl) return activeBackendUrl;

  const candidates = [
    typeof window !== 'undefined' ? localStorage.getItem('DATACLEAN_API_URL') : null,
    'https://dataclean-ai-production.up.railway.app',
    import.meta.env.VITE_API_URL,
    typeof window !== 'undefined' && !window.location.hostname.includes('netlify.app') && !window.location.hostname.includes('localhost') ? window.location.origin : null,
    'https://dataclean-ai-backend.onrender.com',
    'https://nandha2425-dataclean-ai-backend.hf.space',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ].filter(Boolean).map(u => u.trim().replace(/\/+$/, '').replace(/\/api$/, ''));

  const probe = async (target) => {
    try {
      const res = await axios.get(`${target}/health`, { timeout: 12000 });
      if (res.status === 200 && (res.data?.status === 'healthy' || res.data?.app)) {
        return target;
      }
    } catch {
      return null;
    }
    return null;
  };

  const results = await Promise.allSettled(candidates.map(probe));
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      activeBackendUrl = r.value;
      if (typeof window !== 'undefined') {
        localStorage.setItem('DATACLEAN_API_URL', activeBackendUrl);
      }
      return activeBackendUrl;
    }
  }

  return candidates[0] || 'https://dataclean-ai-production.up.railway.app';
};

// Initiate auto-discovery immediately on client startup
if (typeof window !== 'undefined') {
  autoDiscoverBackend();
}

export const getBaseUrl = () => {
  let url = '';
  const localOverride = typeof window !== 'undefined' ? localStorage.getItem('DATACLEAN_API_URL') : null;
  if (localOverride && localOverride.trim()) {
    url = localOverride.trim().replace(/\/+$/, '');
  } else if (activeBackendUrl) {
    url = activeBackendUrl.replace(/\/+$/, '');
  } else if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
  } else {
    url = import.meta.env.PROD ? 'https://dataclean-ai-production.up.railway.app' : 'http://localhost:8000';
  }

  if (url && !url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url || '/api';
};

const api = axios.create({
  timeout: 600000, // 10 min for multi-GB enterprise datasets & heavy ML operations
});

// Request interceptor to set dynamic baseURL on each call
api.interceptors.request.use(
  (config) => {
    config.baseURL = getBaseUrl();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let msg = '';
    const detail = error.response?.data?.detail;
    if (detail) {
      if (typeof detail === 'string') msg = detail;
      else if (Array.isArray(detail)) msg = detail.map(d => d.msg || JSON.stringify(d)).join('; ');
      else msg = JSON.stringify(detail);
    } else if (error.response?.data?.message) {
      msg = error.response.data.message;
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      msg = 'Backend server unreachable. Check Settings to verify your live Backend URL.';
    } else if (error.response?.status === 503) {
      msg = 'Backend server is booting up or sleeping. Please retry in a few seconds.';
    } else {
      msg = error.message || 'Request failed';
    }

    console.error('[API Error]', msg, error.config?.url, error.response?.status);
    const customError = new Error(msg);
    customError.response = error.response;
    return Promise.reject(customError);
  }
);

// ── API helpers ─────────────────────────────────────────────────────────────

export const uploadDataset = async (file, onProgress) => {
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk to bypass cloud proxy body limits

  // For small files (<= 10MB), use single-request direct upload
  if (file.size <= 10 * 1024 * 1024) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return api.post('/upload', formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent, progressEvent.loaded, progressEvent.total, 1, 1);
        }
      }
    });
  }

  // For large files (> 10MB up to 5GB, e.g. 736MB), slice and stream in 10MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  let lastResponse = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkBlob = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunkBlob, `${file.name}.part${chunkIndex}`);
    formData.append('upload_id', uploadId);
    formData.append('chunk_index', String(chunkIndex));
    formData.append('total_chunks', String(totalChunks));
    formData.append('filename', file.name);

    lastResponse = await api.post('/upload-chunk', formData);

    if (onProgress) {
      const loadedBytes = end;
      const percent = Math.round((loadedBytes / file.size) * 100);
      onProgress(percent, loadedBytes, file.size, chunkIndex + 1, totalChunks);
    }
  }

  return lastResponse;
};

/**
 * Run full dataset analysis.
 * @param {number} datasetId
 */
export const analyzeDataset = (datasetId) =>
  api.get(`/analyze/${datasetId}`);

/**
 * Get AI recommendations for a dataset.
 * @param {number} datasetId
 */
export const getRecommendations = (datasetId) =>
  api.get(`/recommend/${datasetId}`);

/**
 * Apply cleaning operations to a dataset.
 * @param {number} datasetId
 * @param {{ operations: Array }} payload
 */
export const cleanDataset = (datasetId, payload) =>
  api.post(`/clean/${datasetId}`, payload);

/**
 * Download the cleaned dataset.
 * @param {number} datasetId
 * @param {'cleaned'|'original'} type
 */
export const downloadDataset = (datasetId, type = 'cleaned') =>
  api.get(`/download/${datasetId}?type=${type}`, { responseType: 'blob' });

/**
 * Generate and download PDF report.
 * @param {number} datasetId
 */
export const generateReport = (datasetId) =>
  api.get(`/report/${datasetId}`, { responseType: 'blob' });

/**
 * Get visualization data for all charts.
 * @param {number} datasetId
 */
export const getVisualizations = (datasetId) =>
  api.get(`/visualize/${datasetId}`);

/**
 * Send a message to the AI chatbot.
 * @param {string} question
 * @param {string} context
 */
export const sendChatMessage = (question, context = '') =>
  api.post('/chat', { question, context });

export const getDatasetPreview = (datasetId, mode = 'head', limit = 20) =>
  api.get(`/preview/${datasetId}?mode=${mode}&limit=${limit}`);

/**
 * Health check
 */
export const checkHealth = () =>
  axios.get(BASE_URL.replace('/api', '') + '/health');

export default api;
