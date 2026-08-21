/**
 * Axios API Client
 * ================
 * Centralized HTTP client for all backend communications.
 */
import axios from 'axios';

export const getBaseUrl = () => {
  let url = '';
  const localOverride = typeof window !== 'undefined' ? localStorage.getItem('DATACLEAN_API_URL') : null;
  if (localOverride && localOverride.trim()) {
    url = localOverride.trim().replace(/\/+$/, '');
  } else if (import.meta.env.VITE_API_URL) {
    url = import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '');
  } else {
    url = import.meta.env.PROD ? 'https://nandha2425-dataclean-ai-backend.hf.space' : '';
  }

  if (url && !url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url || '/api';
};

const api = axios.create({
  timeout: 300000, // 5 min for large enterprise datasets & heavy ML operations
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

/**
 * Upload a dataset file (CSV, Excel, JSON) with live upload progress tracking.
 * @param {File} file
 * @param {Function} onProgress (percent, loadedBytes, totalBytes)
 */
export const uploadDataset = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent, progressEvent.loaded, progressEvent.total);
      }
    }
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
