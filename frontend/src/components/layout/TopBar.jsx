/**
 * Nordic Light TopBar
 */
import { useLocation } from 'react-router-dom';
import { Activity, Database } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

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
  const { currentDataset, sidebarCollapsed } = useAppStore();
  const page = PAGES[pathname] || 'Overview';
  const sidebarW = sidebarCollapsed ? 72 : 260;

  return (
    <header className="fixed top-0 right-0 z-30 flex items-center px-10 h-20 bg-[#F7F6F3]"
      style={{
        left: sidebarW,
        transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
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
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
          <Activity size={14} /> System Active
        </div>
      </div>
    </header>
  );
}
