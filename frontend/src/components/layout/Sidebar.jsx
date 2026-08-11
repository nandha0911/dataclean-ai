/**
 * Nordic Light Sidebar
 */
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Upload, Eye, BarChart3, Brain,
  Sparkles, LineChart, SplitSquareHorizontal, Download,
  Cpu, Settings, ChevronLeft, ChevronRight, Hexagon
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const NAV = [
  { path: '/dashboard',      icon: LayoutDashboard,       label: 'Dashboard' },
  { path: '/upload',         icon: Upload,                label: 'Upload Dataset' },
  { path: '/preview',        icon: Eye,                   label: 'Preview Data' },
  { path: '/quality',        icon: BarChart3,             label: 'Quality Report' },
  { path: '/recommendations',icon: Brain,                 label: 'AI Recommendations' },
  { path: '/clean',          icon: Sparkles,              label: 'Clean Data' },
  { path: '/visualizations', icon: LineChart,             label: 'Visualizations' },
  { path: '/before-after',   icon: SplitSquareHorizontal, label: 'Before & After' },
  { path: '/download',       icon: Download,              label: 'Export' },
  { path: '/model-insights', icon: Cpu,                   label: 'Model Insights' },
  { path: '/settings',       icon: Settings,              label: 'Settings' },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, currentDataset } = useAppStore();
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 260 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen z-40 flex flex-col bg-white border-r border-gray-100"
      style={{ overflow: 'hidden' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-4 px-6 py-8">
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-800">
          <Hexagon size={20} className="fill-current text-gray-200" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
              <h1 className="font-bold text-gray-900 text-lg tracking-tight">DataClean</h1>
              <p className="text-gray-400 text-xs font-medium">Workspace</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dataset info */}
      <AnimatePresence>
        {!sidebarCollapsed && currentDataset && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-6 mb-6">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wide">Active Dataset</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{currentDataset.name}</p>
              <p className="text-xs text-gray-500 mt-1">{currentDataset.rows?.toLocaleString()} rows</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1" style={{ scrollbarWidth: 'none' }}>
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <NavLink key={path} to={path} title={label}>
              <motion.div
                whileHover={{ backgroundColor: active ? '' : '#F7FAFC' }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-colors duration-200 ${
                  active ? 'bg-gray-900 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-gray-400'} />
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="font-medium text-sm whitespace-nowrap">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-full flex items-center justify-center py-3 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
