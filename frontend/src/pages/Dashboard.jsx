/**
 * Dashboard — shows real dataset stats, no hardcoded sample data
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Database, AlertTriangle, Sparkles, TrendingUp,
  ArrowRight, Activity, Brain, Upload as UploadIcon,
} from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';

const TYPE_COLOR = {
  sage: '#7C9082', dusty: '#7A8B99', mustard: '#D4A373', terra: '#C88272',
};

const QUICK_ACTIONS = [
  { label: 'Upload Dataset',       path: '/upload',          color: '#7C9082' },
  { label: 'Quality Report',       path: '/quality',         color: '#D4A373' },
  { label: 'AI Recommendations',   path: '/recommendations', color: '#7A8B99' },
  { label: 'Manual Cleaning',      path: '/clean',           color: '#C88272' },
  { label: 'Visualizations',       path: '/visualizations',  color: '#7C9082' },
  { label: 'Export Data',          path: '/download',        color: '#D4A373' },
];

function EmptyState({ onUpload }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-white shadow-soft flex items-center justify-center text-gray-300">
        <Database size={36} />
      </div>
      <div>
        <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight mb-2">No dataset loaded</h3>
        <p className="text-gray-500 font-medium max-w-sm">
          Upload a CSV, Excel, or JSON file to begin. The AI engine will automatically analyse it.
        </p>
      </div>
      <button onClick={onUpload} className="btn-nd btn-nd-primary shadow-soft">
        <UploadIcon size={16} /> Upload Dataset
      </button>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentDataset, analysisResult, qualityScore } = useAppStore();
  const [showAllColumns, setShowAllColumns] = useState(false);

  const qs = analysisResult?.quality_score?.overall ?? qualityScore ?? null;

  // Derive real stats from analysis result
  const totalMissing = analysisResult?.columns
    ?.reduce((acc, c) => acc + (c.missing_count ?? 0), 0) ?? null;
  const totalOutliers = analysisResult?.columns
    ?.reduce((acc, c) => acc + (c.outliers_iqr ?? 0), 0) ?? null;

  const stats = currentDataset ? [
    {
      label: 'Total Rows',
      value: currentDataset.rows?.toLocaleString() ?? '—',
      sub: currentDataset.name,
      icon: Database,
      color: 'sage',
    },
    {
      label: 'Missing Values',
      value: totalMissing !== null ? totalMissing.toLocaleString() : '—',
      sub: 'Across all columns',
      icon: AlertTriangle,
      color: 'mustard',
    },
    {
      label: 'Outliers Detected',
      value: totalOutliers !== null ? totalOutliers.toLocaleString() : '—',
      sub: 'IQR method',
      icon: Sparkles,
      color: 'dusty',
    },
    {
      label: 'Quality Score',
      value: qs !== null ? `${qs}%` : '—',
      sub: qs !== null ? (qs >= 80 ? 'Excellent' : qs >= 60 ? 'Needs work' : 'Critical') : 'Run analysis first',
      icon: TrendingUp,
      color: qs !== null && qs < 60 ? 'terra' : 'sage',
    },
  ] : [];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Dashboard</h2>
          <p className="text-gray-500 font-medium">
            {currentDataset ? `Active dataset: ${currentDataset.name}` : 'No dataset loaded yet.'}
          </p>
        </div>
        <button onClick={() => navigate('/upload')} className="btn-nd btn-nd-primary shadow-soft">
          <UploadIcon size={16} /> New Dataset
        </button>
      </motion.div>

      {!currentDataset ? (
        <EmptyState onUpload={() => navigate('/upload')} />
      ) : (
        <>
          {/* Real stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <NordicCard color={stat.color} className="h-full group">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{ background: TYPE_COLOR[stat.color] + '18' }}>
                        <Icon size={20} style={{ color: TYPE_COLOR[stat.color] }} />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500">
                        {stat.sub}
                      </span>
                    </div>
                    <div className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2 group-hover:scale-[1.02] transition-transform origin-left">
                      {stat.value}
                    </div>
                    <div className="text-sm font-semibold text-gray-500">{stat.label}</div>
                  </NordicCard>
                </motion.div>
              );
            })}
          </div>

          {/* Analysis status + Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <NordicCard title="Dataset Overview" subtitle="Column breakdown from last analysis" icon={Activity} color="dusty">
                {analysisResult?.columns?.length ? (
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th>Column</th>
                          <th>Type</th>
                          <th>Missing %</th>
                          <th>Outliers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllColumns ? analysisResult.columns : analysisResult.columns.slice(0, 8)).map((col) => (
                          <tr key={col.column_name}>
                            <td className="font-semibold">{col.column_name}</td>
                            <td className="text-gray-400">{col.dtype ?? '—'}</td>
                            <td>
                              <span className={`font-semibold ${(col.missing_pct ?? 0) > 10 ? 'text-[#C88272]' : 'text-gray-700'}`}>
                                {col.missing_pct != null ? `${col.missing_pct.toFixed(1)}%` : '—'}
                              </span>
                            </td>
                            <td className="text-gray-600">{col.outliers_iqr ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {analysisResult.columns.length > 8 && (
                      <div className="flex justify-center mt-4">
                        <button
                          onClick={() => setShowAllColumns(!showAllColumns)}
                          className="text-xs font-semibold text-[#7C9082] hover:text-[#5E6B61] transition-colors py-1.5 px-3 rounded-full bg-gray-50 border border-gray-100 hover:border-gray-200"
                        >
                          {showAllColumns ? 'Show Less' : `+${analysisResult.columns.length - 8} more columns (Show All)`}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
                    <Activity size={32} className="opacity-40" />
                    <p className="font-medium text-sm">Analysis not yet run</p>
                    <button onClick={() => navigate('/quality')} className="btn-nd btn-nd-secondary text-xs">
                      Run Quality Scan
                    </button>
                  </div>
                )}
              </NordicCard>
            </div>

            {/* Quick Actions */}
            <NordicCard title="Quick Actions" subtitle="Navigate the workflow" icon={Brain} color="mustard">
              <div className="space-y-2 mt-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button key={action.path}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
                  >
                    <span className="font-semibold text-gray-700 text-sm">{action.label}</span>
                    <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400 group-hover:text-gray-900 transition-colors">
                      <ArrowRight size={13} />
                    </div>
                  </motion.button>
                ))}
              </div>
            </NordicCard>
          </div>
        </>
      )}
    </div>
  );
}
