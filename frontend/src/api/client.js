/**
 * Axios API Client
 * ================
 * Centralized HTTP client for all backend communications.
 */
import axios from 'axios';

export const getBaseUrl = () => {
  const localOverride = typeof window !== 'undefined' ? localStorage.getItem('DATACLEAN_API_URL') : null;
  if (localOverride && localOverride.trim()) {
    return `${localOverride.trim().replace(/\/$/, '')}/api`;
  }
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.trim().replace(/\/$/, '')}/api`;
  }
  return import.meta.env.PROD ? 'https://nandha2425-dataclean-ai-backend.hf.space/api' : '/api';
};

const api = axios.create({
  timeout: 120000, // 2 min for heavy ML operations
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
    let msg = error.response?.data?.detail || error.message || 'Request failed';
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      msg = 'Backend server unreachable. Check Settings to verify your live Backend URL.';
    } else if (error.response?.status === 503) {
      msg = 'Backend server is booting up or sleeping. Please retry in a few seconds.';
    }
    console.error('[API Error]', msg, error.config?.url);
    return Promise.reject(new Error(msg));
  }
);

// ── API helpers ─────────────────────────────────────────────────────────────

/**
 * Upload a dataset file (CSV, Excel, JSON).
 * @param {File} file
 */
export const uploadDataset = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
