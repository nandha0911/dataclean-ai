/**
 * Nordic Light TopBar with Live Real-time Backend Health Monitor
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, Database, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { getBaseUrl } from '../../api/client';
import axios from 'axios';

const PAGES = {
  '/dashboard':       'Dashboard Overview',
  '/upload':          'Upload Dataset',
  '/preview':         'Dataset Preview',
  '/quality':         'Quality Report',
  '/recommendations': 'AI Recommendations',
  '/clean':           'Data Cleaning',
  '/visualizations':  'Visualizations',
  '/before-after':    'Before & After Diff',
  '/download':        'Export Data',
  '/model-insights':  'Model Insights',
  '/settings':        'Settings',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentDataset, sidebarCollapsed } = useAppStore();
  const page = PAGES[pathname] || 'Overview';
  const sidebarW = sidebarCollapsed ? 72 : 260;

  const [backendStatus, setBackendStatus] = useState('checking'); // 'healthy' | 'offline' | 'checking'

  const checkHealth = async () => {
    try {
      const baseUrl = getBaseUrl().replace(/\/api$/, '');
      const res = await axios.get(`${baseUrl}/health`, { timeout: 12000 });
      if (res.data?.status === 'healthy' || res.status === 200) {
        setBackendStatus('healthy');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center px-10 h-20 bg-[#F7F6F3]"
      style={{
        left: sidebarW,
        transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{page}</h2>
      </div>

      <div className="ml-auto flex items-center gap-4">
        {currentDataset && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-sm font-medium text-gray-600">
            <Database size={14} className="text-gray-400" />
            {currentDataset.name}
          </div>
        )}

        {/* Live Backend Connection Status Pill */}
        <button
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-xs ${
            backendStatus === 'healthy'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              : backendStatus === 'checking'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 animate-pulse'
          }`}
          title="Click to configure Backend URL in Settings"
        >
          {backendStatus === 'healthy' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Backend Online</span>
            </>
          ) : backendStatus === 'checking' ? (
            <>
              <Activity size={13} className="animate-spin" />
              <span>Checking Backend…</span>
            </>
          ) : (
            <>
              <AlertCircle size={13} />
              <span>Backend Offline (Setup)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
