/**
 * Nordic Settings — with Backend Server connection configuration & health test
 */
import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Server, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Settings() {
  const [apiUrl, setApiUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // 'connected' | 'error' | null
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('DATACLEAN_API_URL') || '';
    setApiUrl(saved);
  }, []);

  const handleTestConnection = async () => {
    let raw = apiUrl.trim();
    if (!raw) {
      raw = import.meta.env.PROD ? 'https://dataclean-ai-backend.onrender.com' : 'http://localhost:8000';
    }
    const cleanUrl = raw.replace(/\/+$/, '').replace(/\/api$/, '');
    setTesting(true);
    setStatus(null);
    try {
      const res = await axios.get(`${cleanUrl}/health`, { timeout: 20000 });
      if (res.data?.status === 'healthy' || res.status === 200) {
        setStatus('connected');
        setStatusMsg(`Connected successfully! Version: ${res.data?.version || '1.0.0'}`);
        toast.success('Backend server is healthy & connected!');
      } else {
        setStatus('error');
        setStatusMsg('Server responded but status was not healthy.');
      }
    } catch (err) {
      setStatus('error');
      setStatusMsg(`Cannot connect to ${cleanUrl}. (Error: ${err.message})`);
      toast.error('Backend connection failed. Please check the URL.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (apiUrl.trim()) {
      localStorage.setItem('DATACLEAN_API_URL', apiUrl.trim());
      toast.success('Backend API URL saved!');
    } else {
      localStorage.removeItem('DATACLEAN_API_URL');
      toast.success('Reset to default API URL');
    }
    handleTestConnection();
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Settings</h2>
        <p className="text-gray-500 font-medium">Configure backend server endpoints and system parameters.</p>
      </div>

      {/* Backend Connection Card */}
      <NordicCard title="Backend API Connection" icon={Server} color="sage">
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Enter your deployed backend server URL (from Railway, Hugging Face, or Render). The frontend will connect to this server for AI scanning and cleaning.
          </p>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Backend Server URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://your-backend.up.railway.app"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-[#7C9082]"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="btn-nd btn-nd-secondary px-4 text-xs flex items-center gap-1.5 flex-shrink-0"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : <Server size={14} />}
                {testing ? 'Testing…' : 'Test'}
              </button>
            </div>
          </div>

          {/* Status badge */}
          {status === 'connected' && (
            <div className="p-3 bg-[#F2F5F3] border border-[#7C9082]/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#7C9082]">
              <CheckCircle2 size={16} />
              <span>{statusMsg}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs font-semibold text-red-700">
              <XCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setApiUrl(''); localStorage.removeItem('DATACLEAN_API_URL'); }}
              className="btn-nd btn-nd-secondary text-xs"
            >
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              className="btn-nd btn-nd-primary text-xs px-6"
            >
              <Save size={14} /> Save Backend URL
            </button>
          </div>
        </div>
      </NordicCard>

      {/* General Settings Card */}
      <NordicCard title="System Parameters" icon={SettingsIcon} color="dusty">
        <div className="flex flex-col gap-5 mt-2">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-gray-700">Max Dataset Size (MB)</label>
              <span className="text-xs font-bold text-[#7C9082] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                5 GB Limit
              </span>
            </div>
            <input 
              type="number" 
              defaultValue={localStorage.getItem('DATACLEAN_MAX_SIZE_MB') || 5120} 
              id="input-max-size"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#7C9082] outline-none transition-all" 
            />
            <p className="text-xs text-gray-400 mt-1">Default: 5120 MB (5 GB) supporting large enterprise CSVs/Excel files</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Outlier Z-Score Threshold</label>
            <input 
              type="number" 
              defaultValue={localStorage.getItem('DATACLEAN_ZSCORE_THRESHOLD') || 3.0} 
              step="0.1" 
              id="input-zscore"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#7C9082] outline-none transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Imputation Strategy</label>
            <select 
              defaultValue={localStorage.getItem('DATACLEAN_IMPUTATION_STRATEGY') || "auto"} 
              id="select-imputation"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm cursor-pointer font-medium focus:bg-white focus:border-[#7C9082] outline-none transition-all"
            >
              <option value="auto">AI Recommended (Auto)</option>
              <option value="fast">Fast (Mean / Mode)</option>
              <option value="accurate">Accurate (KNN / MICE)</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                const maxSize = document.getElementById('input-max-size')?.value || 5120;
                const zscore = document.getElementById('input-zscore')?.value || 3.0;
                const strategy = document.getElementById('select-imputation')?.value || 'auto';
                localStorage.setItem('DATACLEAN_MAX_SIZE_MB', maxSize);
                localStorage.setItem('DATACLEAN_ZSCORE_THRESHOLD', zscore);
                localStorage.setItem('DATACLEAN_IMPUTATION_STRATEGY', strategy);
                toast.success('System parameters saved successfully!');
              }}
              className="btn-nd btn-nd-primary text-xs px-6"
            >
              <Save size={14} /> Save System Parameters
            </button>
          </div>
        </div>
      </NordicCard>
    </div>
  );
}
