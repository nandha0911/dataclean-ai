/**
 * High-Speed Upload & AI Ingestion Engine
 * Max 500 MB dataset ingestion with real-time chunk streaming,
 * live progress indicators, and instant automatic quality scanning.
 */
import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, AlertCircle, X, ArrowRight,
  Activity, CheckCircle2, Database, Sparkles, BarChart2, Server
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { uploadDataset, analyzeDataset, getBaseUrl } from '../api/client';
import axios from 'axios';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/json': ['.json'],
};

export default function UploadPage() {
  const navigate = useNavigate();
  const { setDataset, setAnalysis } = useAppStore();
  const [file, setFile] = useState(null);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadBytes, setUploadBytes] = useState({ loaded: 0, total: 0 });
  const [step, setStep] = useState('idle'); // idle | uploading | analyzing | done | error
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  // ── Inline Backend Connection State ──
  const [backendUrlInput, setBackendUrlInput] = useState('');
  const [backendHealthy, setBackendHealthy] = useState(null); // true | false | null
  const [checkingBackend, setCheckingBackend] = useState(false);

  const checkLiveBackend = async (url) => {
    const target = (url || getBaseUrl()).replace(/\/api$/, '').replace(/\/+$/, '');
    setCheckingBackend(true);
    try {
      const res = await axios.get(`${target}/health`, { timeout: 4000 });
      if (res.data?.status === 'healthy' || res.status === 200) {
        setBackendHealthy(true);
      } else {
        setBackendHealthy(false);
      }
    } catch {
      setBackendHealthy(false);
    } finally {
      setCheckingBackend(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('DATACLEAN_API_URL') || '';
    setBackendUrlInput(saved);
    checkLiveBackend(saved);
  }, []);

  const handleConnectBackend = () => {
    if (backendUrlInput.trim()) {
      localStorage.setItem('DATACLEAN_API_URL', backendUrlInput.trim());
      toast.success('Backend server URL saved!');
    } else {
      localStorage.removeItem('DATACLEAN_API_URL');
      toast('Reset to default backend', { icon: 'ℹ️' });
    }
    checkLiveBackend(backendUrlInput.trim());
  };

  const onDrop = useCallback((accepted) => {
    if (!accepted.length) return;
    setFile(accepted[0]);
    setStep('idle');
    setResult(null);
    setUploadPercent(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 500 * 1024 * 1024, // 500 MB Max
    multiple: false,
  });

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleUpload = async () => {
    if (!file) return;

    // ── Phase 1: Real-time Chunked Upload ──────────────────────────────
    setStep('uploading');
    setUploadPercent(0);

    let uploadRes;
    try {
      uploadRes = await uploadDataset(file, (percent, loaded, total) => {
        setUploadPercent(percent);
        setUploadBytes({ loaded, total });
      });
    } catch (err) {
      setStep('error');
      const msg = err?.response?.data?.detail || err?.message || 'Upload failed. Check backend connection.';
      setErrMsg(msg);
      toast.error(msg);
      return;
    }

    const { dataset_id, filename, row_count, col_count, preview } = uploadRes.data;
    setDataset({ id: dataset_id, name: filename, rows: row_count, cols: col_count, preview });
    toast.success(`Uploaded ${filename} (${row_count.toLocaleString()} rows)`);

    // ── Phase 2: AI Multi-Dimensional Analysis ─────────────────────────
    setStep('analyzing');
    try {
      const anaRes = await analyzeDataset(dataset_id);
      setAnalysis(anaRes.data);
      toast.success('AI Quality Scan completed!');
    } catch (err) {
      console.warn('Analysis note:', err?.message);
      toast('Quality analysis will continue in the background', { icon: 'ℹ️' });
    }

    setStep('done');
    setResult({ dataset_id, filename, row_count, col_count, size: file.size });
  };

  const reset = () => {
    setFile(null);
    setStep('idle');
    setUploadPercent(0);
    setResult(null);
  };

  const isProcessing = step === 'uploading' || step === 'analyzing';
  const isDone = step === 'done';

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="text-center mt-2">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-soft flex items-center justify-center mx-auto mb-4 text-[#7C9082] border border-gray-100">
          <Database size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Upload your dataset</h2>
        <p className="text-gray-500 font-medium flex items-center justify-center gap-2">
          <span>Supports CSV, Excel (.xlsx, .xls), and JSON files up to</span>
          <span className="px-2.5 py-0.5 bg-[#7C9082]/15 text-[#7C9082] rounded-full text-xs font-bold">500 MB</span>
        </p>
      </div>

      {/* ── Inline Backend Server Connection Bar ── */}
      <div className="bg-white rounded-2xl p-3.5 shadow-soft border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${backendHealthy === true ? 'bg-emerald-500 shadow-sm' : backendHealthy === false ? 'bg-rose-500' : 'bg-amber-400 animate-pulse'}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-800">Backend Server:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${backendHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {backendHealthy ? '✓ Online' : 'Offline / Setup'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="https://your-railway-app.up.railway.app"
            value={backendUrlInput}
            onChange={(e) => setBackendUrlInput(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-800 outline-none flex-1 sm:w-64 focus:border-[#7C9082]"
          />
          <button
            onClick={handleConnectBackend}
            disabled={checkingBackend}
            className="btn-nd btn-nd-sage px-3 py-1.5 text-xs font-bold whitespace-nowrap flex-shrink-0 flex items-center gap-1"
          >
            {checkingBackend ? <Activity size={12} className="animate-spin" /> : <Server size={12} />}
            <span>{checkingBackend ? 'Connecting…' : 'Connect'}</span>
          </button>
        </div>
      </div>

      {/* Drop zone — visible when not processing */}
      {!isProcessing && !isDone && (
        <div {...getRootProps()}>
          <motion.div
            animate={{
              borderColor: isDragActive ? '#7C9082' : file ? '#7C9082' : '#E2E8F0',
              backgroundColor: isDragActive ? '#F2F5F3' : file ? '#F9FAF9' : '#FFFFFF',
              scale: isDragActive ? 1.01 : 1
            }}
            className="border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all shadow-soft relative overflow-hidden"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform ${file ? 'bg-[#7C9082] text-white shadow-md' : 'bg-gray-50 text-gray-400'}`}>
                {file ? <FileText size={28} /> : <Upload size={28} className={isDragActive ? 'text-[#7C9082]' : 'text-gray-400'} />}
              </div>
              <div>
                {file ? (
                  <>
                    <div className="font-extrabold text-gray-900 text-lg mb-1">{file.name}</div>
                    <div className="text-xs font-bold text-[#7C9082] bg-[#7C9082]/10 px-3 py-1 rounded-full inline-block mt-1">
                      {formatBytes(file.size)} · Ready to ingest
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-extrabold text-gray-900 text-lg mb-1">
                      {isDragActive ? 'Drop dataset file here' : 'Drag & drop dataset file here'}
                    </div>
                    <div className="text-xs font-semibold text-gray-400">or click anywhere to browse from computer</div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Processing Pipeline View */}
      <AnimatePresence mode="wait">
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-8 bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col gap-6"
          >
            {/* Step 1: Uploading */}
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${step === 'uploading' ? 'bg-[#7A8B99]/20 text-[#7A8B99]' : 'bg-[#7C9082] text-white'}`}>
                {step === 'uploading' ? <Activity size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-gray-800">
                    {step === 'uploading' ? 'Streaming Dataset Chunks to Server...' : 'File Upload Complete'}
                  </span>
                  <span className="text-xs font-extrabold text-[#7C9082]">
                    {step === 'uploading' ? `${uploadPercent}%` : '100%'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#7C9082] rounded-full"
                    style={{ width: `${step === 'uploading' ? uploadPercent : 100}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                {step === 'uploading' && uploadBytes.total > 0 && (
                  <div className="text-[11px] text-gray-400 font-semibold mt-1.5 flex justify-between">
                    <span>{formatBytes(uploadBytes.loaded)} of {formatBytes(uploadBytes.total)}</span>
                    <span>High-Speed 4MB Buffer</span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: AI Deep Scan */}
            <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${step === 'analyzing' ? 'bg-[#7C9082]/20 text-[#7C9082]' : 'bg-gray-100 text-gray-400'}`}>
                {step === 'analyzing' ? <Sparkles size={20} className="animate-pulse" /> : <Database size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-bold block ${step === 'analyzing' ? 'text-gray-900' : 'text-gray-400'}`}>
                  {step === 'analyzing' ? 'Running Multi-Dimensional AI Quality Scan...' : 'Waiting for Ingestion...'}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {step === 'analyzing' ? 'Detecting missing patterns, outliers, encodings & 25 quality dimensions' : 'Calculates statistics, distributions & correlations'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Ingestion Complete Overview */}
        {isDone && result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-white rounded-3xl shadow-soft border-2 border-[#7C9082]/30 flex flex-col gap-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#7C9082]/15 text-[#7C9082] flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg truncate max-w-md">{result.filename}</h3>
                  <p className="text-xs text-gray-500 font-medium">Successfully parsed & indexed · {formatBytes(result.size)}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#F2F5F3] text-[#7C9082] text-xs font-bold rounded-full border border-[#7C9082]/20">
                Active In-Memory
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Total Rows</div>
                <div className="text-2xl font-extrabold text-gray-900">{result.row_count?.toLocaleString()}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Columns</div>
                <div className="text-2xl font-extrabold text-gray-900">{result.col_count}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Dataset ID</div>
                <div className="text-2xl font-extrabold text-[#7C9082]">#{result.dataset_id}</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 bg-[#F8F2F0] text-[#C88272] rounded-3xl border border-[#C88272]/20 flex items-start gap-3"
          >
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              <strong className="block font-bold text-sm mb-0.5">Upload Failed</strong>
              {errMsg}
            </div>
            <button onClick={reset} className="opacity-70 hover:opacity-100 text-xs font-bold px-2 py-1 bg-white rounded-lg shadow-xs">
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Footer */}
      <div className="flex gap-4 flex-wrap">
        {file && !isProcessing && !isDone && (
          <>
            <button onClick={handleUpload} className="flex-1 btn-nd btn-nd-sage justify-center py-4 text-sm font-bold shadow-soft flex items-center gap-2">
              <Upload size={16} /> Ingest &amp; Analyze Dataset
            </button>
            <button onClick={reset} className="btn-nd btn-nd-secondary justify-center px-6 text-sm">
              Cancel
            </button>
          </>
        )}
        {isDone && (
          <>
            <button
              onClick={() => navigate('/recommendations')}
              className="flex-1 btn-nd btn-nd-sage justify-center py-4 text-sm font-bold shadow-soft flex items-center gap-2"
            >
              <Sparkles size={16} /> View AI Recommendations <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/visualizations')}
              className="btn-nd btn-nd-secondary justify-center py-4 px-6 text-sm font-bold flex items-center gap-2"
            >
              <BarChart2 size={16} /> Visualizations
            </button>
            <button onClick={reset} className="btn-nd btn-nd-secondary justify-center px-6 text-sm">
              Upload Another
            </button>
          </>
        )}
      </div>
    </div>
  );
}
