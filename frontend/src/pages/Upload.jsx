/**
 * Upload Page — auto-triggers analysis after upload so all downstream
 * pages (Recommendations, Visualizations) work immediately.
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileText, AlertCircle, X,
  ArrowRight, Activity, CheckCircle2,
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { uploadDataset, analyzeDataset } from '../api/client';
import toast from 'react-hot-toast';

const ACCEPTED_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/json': ['.json'],
};

const STEPS = [
  { id: 'upload',  label: 'Uploading file...'         },
  { id: 'analyze', label: 'Running AI analysis...'    },
  { id: 'done',    label: 'Ready!'                    },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { setDataset, setAnalysis } = useAppStore();
  const [file, setFile]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [step, setStep]     = useState('idle'); // idle | upload | analyze | done | error
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const onDrop = useCallback((accepted) => {
    if (!accepted.length) return;
    setFile(accepted[0]); setStep('idle'); setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, maxSize: 100 * 1024 * 1024, multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    // ── Step 1: Upload ──────────────────────────────────────────────────
    setStep('upload'); setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p + 6, 80)), 180);
    let uploadRes;
    try {
      uploadRes = await uploadDataset(file);
      clearInterval(iv); setProgress(85);
    } catch (err) {
      clearInterval(iv);
      setStep('error');
      setErrMsg(err?.message || 'Upload failed — is the backend running?');
      toast.error('Upload failed');
      return;
    }

    const { dataset_id, filename, row_count, col_count, preview } = uploadRes.data;
    setDataset({ id: dataset_id, name: filename, rows: row_count, cols: col_count, preview });
    toast.success('File uploaded');

    // ── Step 2: Auto-Analyze ────────────────────────────────────────────
    setStep('analyze'); setProgress(88);
    try {
      const anaRes = await analyzeDataset(dataset_id);
      setAnalysis(anaRes.data);
      setProgress(100);
    } catch (err) {
      // Non-fatal: analysis failed, user can retry from Quality Report page
      console.warn('Auto-analysis failed:', err?.message);
      toast('Analysis will be available on the Quality Report page', { icon: 'ℹ️' });
    }

    setStep('done');
    setResult({ dataset_id, filename, row_count, col_count });
    toast.success('Dataset ready!');
  };

  const reset = () => { setFile(null); setStep('idle'); setProgress(0); setResult(null); };
  const isProcessing = step === 'upload' || step === 'analyze';
  const isDone       = step === 'done';

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="text-center mt-4">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-soft flex items-center justify-center mx-auto mb-6 text-gray-400">
          <Upload size={24} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">Upload your dataset</h2>
        <p className="text-gray-500 font-medium">Supports CSV, Excel, and JSON files up to 100 MB.</p>
      </div>

      {/* Drop zone — hidden while processing */}
      {!isProcessing && !isDone && (
        <div {...getRootProps()}>
          <motion.div
            animate={{
              borderColor: isDragActive ? '#7C9082' : file ? '#7A8B99' : '#E2E8F0',
              backgroundColor: isDragActive ? '#F2F5F3' : file ? '#F2F4F5' : '#FFFFFF',
            }}
            className="border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-colors shadow-soft"
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${file ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                {file
                  ? <FileText size={24} className="text-[#7A8B99]" />
                  : <Upload  size={24} className={isDragActive ? 'text-[#7C9082]' : 'text-gray-400'} />}
              </div>
              <div>
                {file ? (
                  <>
                    <div className="font-bold text-gray-900 text-lg mb-1">{file.name}</div>
                    <div className="text-sm font-medium text-gray-500">
                      {file.size < 1024
                        ? `${file.size} B`
                        : file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / 1024 / 1024).toFixed(2)} MB`
                      } · Click to replace
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-bold text-gray-900 text-lg mb-1">
                      {isDragActive ? 'Drop file here' : 'Select a file to upload'}
                    </div>
                    <div className="text-sm font-medium text-gray-500">or drag and drop it here</div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Processing steps */}
        {isProcessing && (
          <motion.div key="processing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-8 bg-white rounded-3xl shadow-soft">
            <div className="space-y-4 mb-6">
              {STEPS.filter(s => s.id !== 'done').map((s) => {
                const isActive  = step === s.id;
                const isDoneStep = (step === 'analyze' && s.id === 'upload') || (step === 'done' && s.id !== 'done');
                return (
                  <div key={s.id} className="flex items-center gap-3">
                    {isDoneStep
                      ? <CheckCircle2 size={18} className="text-[#7C9082] flex-shrink-0" />
                      : isActive
                        ? <Activity size={18} className="text-[#7A8B99] animate-spin flex-shrink-0" />
                        : <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-200 flex-shrink-0" />}
                    <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : isDoneStep ? 'text-[#7C9082]' : 'text-gray-400'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-sm font-semibold text-gray-500 mb-2">
              <span>{step === 'upload' ? 'Uploading...' : 'Analyzing...'}</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bg">
              <motion.div className="progress-fill bg-[#7C9082]" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>
        )}

        {/* Success state */}
        {isDone && result && (
          <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-8 bg-white rounded-3xl shadow-soft border border-[#7C9082] border-opacity-30">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 size={24} className="text-[#7C9082]" />
              <div>
                <div className="font-bold text-gray-900">{result.filename}</div>
                <div className="text-sm text-gray-500 font-medium">Upload and analysis complete</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-2">
              {[
                { label: 'Rows',    value: result.row_count?.toLocaleString() ?? '—' },
                { label: 'Columns', value: String(result.col_count ?? '—') },
                { label: 'Dataset ID', value: `#${result.dataset_id}` },
              ].map(s => (
                <div key={s.label} className="p-4 bg-gray-50 rounded-2xl text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</div>
                  <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Error state */}
        {step === 'error' && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-4 bg-[#F8F2F0] text-[#C88272] rounded-2xl">
            <AlertCircle size={18} />
            <span className="font-semibold text-sm">{errMsg}</span>
            <button onClick={reset} className="ml-auto opacity-70 hover:opacity-100"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-4">
        {file && !isProcessing && !isDone && (
          <>
            <button onClick={handleUpload} className="flex-1 btn-nd btn-nd-primary justify-center py-4 text-sm shadow-soft">
              Upload &amp; Analyse
            </button>
            <button onClick={reset} className="btn-nd btn-nd-secondary justify-center px-6">
              Cancel
            </button>
          </>
        )}
        {isDone && (
          <button onClick={() => navigate('/quality')}
            className="flex-1 btn-nd btn-nd-sage justify-center py-4 text-sm shadow-soft flex items-center gap-2">
            View Quality Report <ArrowRight size={16} />
          </button>
        )}
        {isDone && (
          <button onClick={reset} className="btn-nd btn-nd-secondary justify-center px-6">
            Upload Another
          </button>
        )}
      </div>
    </div>
  );
}
