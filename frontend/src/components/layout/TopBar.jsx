/**
 * Nordic Light TopBar with Theme Quick Palette Indicator
 */
import { useLocation, Link } from 'react-router-dom';
import { Database, Palette } from 'lucide-react';
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
  '/settings':        'Settings & Appearance',
};

const THEME_NAMES = {
  'sage': 'Nordic Sage',
  'azure': 'Royal Azure',
  'emerald': 'Emerald Mint',
  'violet': 'Lavender & Iris',
  'amber': 'Amber Honey',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { currentDataset, sidebarCollapsed, theme } = useAppStore();
  const page = PAGES[pathname] || 'Overview';
  const sidebarW = sidebarCollapsed ? 72 : 260;

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center px-10 h-20"
      style={{
        left: sidebarW,
        backgroundColor: 'var(--nd-bg)',
        transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
      }}
    >
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{page}</h2>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Quick Theme Switcher Shortcut */}
        <Link
          to="/settings"
          className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 rounded-full border border-gray-200/80 shadow-xs text-xs font-semibold text-gray-700 transition-all"
          title="Change Color Palette in Settings"
        >
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--nd-primary)' }} />
          <span>{THEME_NAMES[theme] || 'Color Theme'}</span>
          <Palette size={13} className="text-gray-400" />
        </Link>

        {currentDataset && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-sm font-medium text-gray-600">
            <Database size={14} className="text-gray-400" />
            {currentDataset.name}
          </div>
        )}
      </div>
    </header>
  );
}
