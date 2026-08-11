/**
 * Nordic Quality Report
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, Download, AlertTriangle, TrendingUp } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import QualityDashboard from '../components/charts/QualityDashboard';
import useAppStore from '../store/useAppStore';
import { analyzeDataset, generateReport } from '../api/client';
import toast from 'react-hot-toast';

const DIMS = [
  { key: 'completeness', label: 'Completeness', color: '#7C9082' },
  { key: 'consistency',  label: 'Consistency',  color: '#7A8B99' },
  { key: 'accuracy',     label: 'Accuracy',     color: '#D4A373' },
  { key: 'uniqueness',   label: 'Uniqueness',   color: '#7C9082' },
  { key: 'validity',     label: 'Validity',     color: '#7A8B99' },
  { key: 'integrity',    label: 'Integrity',    color: '#C88272' },
];
const SEV = {
  HIGH:   { badge: 'badge-terra' },
  MEDIUM: { badge: 'badge-mustard' },
  LOW:    { badge: 'badge-sage' },
};


export default function QualityReport() {
  const { currentDataset, analysisResult, setAnalysis } = useAppStore();
  const [scores, setScores] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (analysisResult?.quality_score) setScores(analysisResult.quality_score);
    if (analysisResult?.columns) {
      const found = analysisResult.columns.filter(c => c.missing_pct > 0 || c.outliers_iqr > 0 || c.constant).map(c => ({
        col: c.column_name,
        issue: c.missing_pct > 0 ? `Missing (${c.missing_pct?.toFixed(1)}%)` : c.constant ? 'Constant' : `Outliers (${c.outliers_iqr})`,
        severity: c.missing_pct > 20 || c.constant ? 'HIGH' : c.missing_pct > 5 ? 'MEDIUM' : 'LOW',
        count: c.missing_count || c.outliers_iqr || 0,
      }));
      if (found.length) setIssues(found);
    }
  }, [analysisResult]);

  const refresh = async () => {
    if (!currentDataset?.id) return toast.error('No dataset loaded');
    setLoading(true);
    try {
      const res = await analyzeDataset(currentDataset.id);
      setAnalysis(res.data);
      if (res.data?.quality_score) setScores(res.data.quality_score);
      toast.success('Scan complete');
    } catch { toast.error('Scan failed'); }
    finally { setLoading(false); }
  };

  const overallScore = scores ? Math.round(scores.overall_score ?? scores.overall ?? 0) : 0;
  const sc = scores ? (overallScore >= 80 ? '#7C9082' : overallScore >= 60 ? '#D4A373' : '#C88272') : '#CBD5E0';

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Quality Report</h2>
          <p className="text-gray-500 font-medium">Multi-dimensional health analysis of your dataset.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refresh} disabled={loading} className="btn-nd btn-nd-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {scores ? 'Refresh Scan' : 'Run Scan'}
          </button>
        </div>
      </div>

      {!scores ? (
        /* ── Empty state ── */
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center bg-white rounded-3xl shadow-soft border border-gray-100">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No analysis data yet</h3>
            <p className="text-gray-400 font-medium text-sm max-w-sm">
              {currentDataset ? 'Click "Run Scan" to analyse your dataset.' : 'Upload a dataset first, then run the quality scan.'}
            </p>
          </div>
          {currentDataset && (
            <button onClick={refresh} disabled={loading} className="btn-nd btn-nd-sage">
              {loading ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />} Run Quality Scan
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <NordicCard title="Overall Health" icon={ShieldCheck} color={overallScore >= 80 ? 'sage' : overallScore >= 60 ? 'mustard' : 'terra'}>
              <div className="flex flex-col items-center justify-center flex-1 py-4">
                <div className="relative flex items-center justify-center w-40 h-40 mb-6">
                  <svg className="absolute inset-0" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#F2F4F5" strokeWidth="8" />
                    <motion.circle cx="50" cy="50" r="45" fill="none" stroke={sc} strokeWidth="8" strokeDasharray="283"
                      initial={{ strokeDashoffset: 283 }} animate={{ strokeDashoffset: 283 - (overallScore / 100) * 283 }}
                      transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }} strokeLinecap="round" />
                  </svg>
                  <div className="text-center z-10">
                    <div className="text-4xl font-extrabold text-gray-900 tracking-tight">{overallScore}%</div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-gray-50 rounded-full text-sm font-semibold text-gray-600">
                  {overallScore >= 80 ? 'Excellent Condition' : overallScore >= 60 ? 'Needs Attention' : 'Critical Issues'}
                </div>
              </div>
            </NordicCard>

            <div className="lg:col-span-2">
              <NordicCard title="Dimension Radar" icon={TrendingUp} color="dusty">
                <div className="h-72 mt-2"><QualityDashboard scores={scores} /></div>
              </NordicCard>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NordicCard title="Quality Dimensions" color="sage">
              <div className="flex flex-col gap-6 mt-2">
                {DIMS.map((d, i) => (
                  <div key={d.key}>
                    <div className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                      <span>{d.label}</span>
                      <span style={{ color: d.color }}>{scores[d.key] ?? 0}%</span>
                    </div>
                    <div className="progress-bg">
                      <motion.div className="progress-fill" style={{ background: d.color }}
                        initial={{ width: 0 }} animate={{ width: `${scores[d.key] ?? 0}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
                    </div>
                  </div>
                ))}
              </div>
            </NordicCard>

            <NordicCard title={`Identified Issues (${issues.length})`} icon={AlertTriangle} color="terra">
              {issues.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium text-sm">No issues detected</div>
              ) : (
                <div className="overflow-x-auto mt-2">
                  <table>
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Issue Detected</th>
                        <th>Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((iss, i) => (
                        <tr key={i}>
                          <td className="font-semibold">{iss.col}</td>
                          <td className="text-gray-500">{iss.issue}</td>
                          <td>
                            <span className={`badge-nd ${SEV[iss.severity]?.badge ?? 'badge-sage'}`}>
                              {iss.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </NordicCard>
          </div>
        </>
      )}
    </div>
  );
}
