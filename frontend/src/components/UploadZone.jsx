/**
 * UploadZone — Drag & Drop file upload component
 * ================================================
 * Accepts CSV, Excel, and JSON files, uploads to the backend,
 * and stores the dataset info in global state.
 */
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, FileSpreadsheet, FileJson, FileText, CheckCircle, XCircle } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { uploadDataset } from '../api/client';
import toast from 'react-hot-toast';

const FILE_TYPES = [
  { ext: 'CSV', icon: FileText, color: '#FFB000' },
  { ext: 'XLSX', icon: FileSpreadsheet, color: '#39FF14' },
  { ext: 'JSON', icon: FileJson, color: '#00FFFF' },
];

export default function UploadZone() {
  const { setDataset, setLoading } = useAppStore();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadProgress(0);
    setLoading(true);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 15, 85));
    }, 200);

    try {
      const response = await uploadDataset(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = response.data;
      const dataset = {
        id: data.dataset_id,
        name: data.filename,
        rows: data.row_count,
        cols: data.col_count,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        preview: data.preview || [],
      };
      setDataset(dataset);
      setUploadedFile(file);
      toast.success(`✓ ${file.name} uploaded successfully`);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message || 'Upload failed');
      toast.error('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }, [setDataset, setLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <motion.div
        {...getRootProps()}
        whileHover={{ boxShadow: '0 0 25px rgba(57,255,20,0.3)' }}
        className="border-4 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300"
        style={{
          borderColor: isDragActive ? '#00FFFF' : error ? '#FF00FF' : '#39FF14',
          backgroundColor: isDragActive ? 'rgba(0,255,255,0.05)' : 'rgba(57,255,20,0.02)',
          boxShadow: isDragActive ? '0 0 30px rgba(0,255,255,0.2)' : undefined,
          opacity: uploading ? 0.7 : 1,
        }}
      >
        <input {...getInputProps()} />

        {/* Upload Icon */}
        <motion.div
          animate={{
            y: isDragActive ? -12 : 0,
            scale: isDragActive ? 1.1 : 1,
          }}
          className="mb-4"
          style={{ color: isDragActive ? '#00FFFF' : '#39FF14' }}
        >
          <UploadIcon size={52} />
        </motion.div>

        {/* Title */}
        <h3
          className="font-heading text-xl mb-2"
          style={{
            color: isDragActive ? '#00FFFF' : '#39FF14',
            textShadow: isDragActive ? '0 0 12px #00FFFF' : '0 0 8px #39FF14',
          }}
        >
          {uploading
            ? 'UPLOADING...'
            : isDragActive
            ? 'RELEASE TO TRANSFER →'
            : '▶ INSERT DATA DISK'}
        </h3>
        <p className="font-mono mb-6" style={{ color: '#39FF14', opacity: 0.6 }}>
          Drag & drop or click to mount file system
        </p>

        {/* Upload Progress Bar */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xs"
            >
              <div className="flex justify-between text-xs mb-1 font-mono" style={{ color: '#FFB000' }}>
                <span>TRANSFERRING DATA BLOCKS...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div
                className="h-3 w-full"
                style={{ border: '1px solid #39FF14', backgroundColor: '#111' }}
              >
                <motion.div
                  className="h-full"
                  animate={{ width: `${uploadProgress}%` }}
                  style={{ backgroundColor: '#39FF14', boxShadow: '0 0 8px #39FF14' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File type icons */}
        {!uploading && (
          <div className="flex gap-8 mt-2">
            {FILE_TYPES.map(({ ext, icon: Icon, color }) => (
              <div key={ext} className="flex flex-col items-center gap-1">
                <Icon size={24} style={{ color }} />
                <span className="font-mono text-xs" style={{ color, opacity: 0.8 }}>
                  {ext}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Success / Error states */}
      <AnimatePresence>
        {uploadedFile && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 border font-mono text-sm"
            style={{ borderColor: '#39FF14', color: '#39FF14', backgroundColor: 'rgba(57,255,20,0.05)' }}
          >
            <CheckCircle size={20} />
            <span>
              ✓ {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB) — READY
            </span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-3 border font-mono text-sm"
            style={{ borderColor: '#FF00FF', color: '#FF00FF', backgroundColor: 'rgba(255,0,255,0.05)' }}
          >
            <XCircle size={20} />
            <span>ERROR: {error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
