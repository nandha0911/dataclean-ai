/**
 * Nordic Export Page — Full Quality Report with Before/After comparison
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, FileText, FileCode, RefreshCw, AlertCircle,
  ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2,
  ArrowRight, BarChart2, Table, Layers, Eye
} from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import { downloadDataset, generateReport, analyzeDataset } from '../api/client';
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
  HIGH:   'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW:    'bg-green-100 text-green-700',
};

function ScoreRing({ score, color }) {
  const dash = 283;
  const offset = dash - (score / 100) * dash;
  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#F2F4F5" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={dash} initial={{ strokeDashoffset: dash }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          strokeLinecap="round" />
      </svg>
      <div className="z-10 text-center">
        <div className="text-2xl font-extrabold text-gray-900">{score}%</div>
      </div>
    </div>
  );
}

function DimBar({ label, before, after, color }) {
  const improved = after !== null && after > before;
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1.5">
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-gray-400">{before ?? '—'}%</span>
          {after !== null && (
            <>
              <ArrowRight size={10} className="text-gray-300" />
              <span style={{ color: improved ? '#7C9082' : '#C88272' }} className="font-bold">
                {after}%
                {improved && <span className="ml-1 text-[10px]">▲+{(after - before).toFixed(0)}</span>}
              </span>
            </>
          )}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
        <motion.div className="h-full rounded-full absolute"
          style={{ background: color + '55', left: 0 }}
          initial={{ width: 0 }} animate={{ width: `${before ?? 0}%` }}
          transition={{ duration: 0.8 }} />
        {after !== null && (
          <motion.div className="h-full rounded-full absolute"
            style={{ background: color, left: 0 }}
            initial={{ width: 0 }} animate={{ width: `${after ?? 0}%` }}
            transition={{ duration: 0.8, delay: 0.3 }} />
        )}
      </div>
    </div>
  );
}

export default function DownloadPage() {
  const { currentDataset, analysisResult, setAnalysis } = useAppStore();

  const [downloadingCsv, setDownloadingCsv]   = useState(false);
  const [downloadingPdf, setDownloadingPdf]   = useState(false);
  const [scanning, setScanning]               = useState(false);
  const [scores, setScores]                   = useState(null);
  const [issues, setIssues]                   = useState([]);
  const [beforeScores, setBeforeScores]       = useState(null);
  const [activeTab, setActiveTab]             = useState('overview'); // overview | columns | issues

  // Derive scores from existing analysis in store
  useEffect(() => {
    if (analysisResult?.quality_score) {
      if (!beforeScores) setBeforeScores(analysisResult.quality_score);   // first scan = "before"
      setScores(analysisResult.quality_score);
    }
    if (analysisResult?.columns) {
      const found = analysisResult.columns
        .filter(c => c.missing_pct > 0 || c.outliers_iqr > 0 || c.constant || c.duplicate_count > 0)
        .map(c => ({
          col: c.column_name,
          dtype: c.dtype || 'unknown',
          missing_pct: c.missing_pct ?? 0,
          outliers: c.outliers_iqr ?? 0,
          duplicates: c.duplicate_count ?? 0,
          issue: c.missing_pct > 0
            ? `${c.missing_pct?.toFixed(1)}% missing`
            : c.constant
            ? 'Constant column'
            : `${c.outliers_iqr} outliers`,
          severity: c.missing_pct > 20 || c.constant ? 'HIGH' : c.missing_pct > 5 || c.outliers_iqr > 10 ? 'MEDIUM' : 'LOW',
        }));
      setIssues(found);
    }
  }, [analysisResult]);

  const runScan = async () => {
    if (!currentDataset?.id) return toast.error('No dataset loaded');
    setScanning(true);
    try {
      const res = await analyzeDataset(currentDataset.id);
      setAnalysis(res.data);
      if (res.data?.quality_score) {
        if (!beforeScores) setBeforeScores(res.data.quality_score);
        setScores(res.data.quality_score);
      }
      toast.success('Quality scan complete');
    } catch { toast.error('Scan failed'); }
    finally { setScanning(false); }
  };

  const handleDownloadCSV = async () => {
    if (!currentDataset?.id) return toast.error('No dataset active');
    setDownloadingCsv(true);
    try {
      const res = await downloadDataset(currentDataset.id, 'cleaned');
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `cleaned_${currentDataset.name || currentDataset.id}.csv`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Cleaned dataset downloaded!');
    } catch (err) { toast.error(err.message || 'Download failed'); }
    finally { setDownloadingCsv(false); }
  };

  const handleDownloadPDF = async () => {
    if (!currentDataset?.id) return toast.error('No dataset active');
    setDownloadingPdf(true);
    try {
      const res = await generateReport(currentDataset.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', `quality_report_${currentDataset.id}.pdf`);
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF Quality Report downloaded!');
    } catch (err) { toast.error(err.message || 'PDF generation failed'); }
    finally { setDownloadingPdf(false); }
  };

  const overall     = scores  ? Math.round(scores.overall_score  ?? scores.overall  ?? 0) : 0;
  const overallPrev = beforeScores ? Math.round(beforeScores.overall_score ?? beforeScores.overall ?? 0) : null;
  const scoreColor  = overall >= 80 ? '#7C9082' : overall >= 60 ? '#D4A373' : '#C88272';
  const hasAfter    = currentDataset?.isCleaned && beforeScores && scores !== beforeScores;

  const columns = analysisResult?.columns || [];
  const totalMissing = columns.reduce((s, c) => s + (c.missing_count || 0), 0);
  const totalOutliers = columns.reduce((s, c) => s + (c.outliers_iqr || 0), 0);
  const totalDuplicates = analysisResult?.full_row_duplicates || 0;

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Export & Quality Report</h2>
          <p className="text-gray-500 font-medium">
            {currentDataset
              ? `${currentDataset.name || 'Dataset'} · ${currentDataset.rows || 0} rows · ${currentDataset.cols || 0} columns`
              : 'Upload a dataset to generate reports'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={runScan} disabled={!currentDataset || scanning}
            className="btn-nd btn-nd-secondary gap-2">
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning…' : scores ? 'Re-scan' : 'Run Quality Scan'}
          </button>
        </div>
      </div>

      {!currentDataset && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 text-sm font-semibold">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
          No active dataset. Please upload a dataset to enable export options.
        </div>
      )}

      {/* ── Download Actions ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV */}
        <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-2xl bg-[#F2F5F3] text-[#7C9082] flex items-center justify-center">
            <FileCode size={26} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cleaned Dataset</h3>
            <p className="text-gray-500 text-xs font-medium">CSV with all imputations, outlier fixes & transformations applied</p>
          </div>
          {currentDataset && (
            <div className="flex gap-3 text-xs font-semibold text-gray-500">
              <span className="px-3 py-1 bg-gray-50 rounded-full">{currentDataset.rows || 0} rows</span>
              <span className="px-3 py-1 bg-gray-50 rounded-full">{currentDataset.cols || 0} cols</span>
              {currentDataset.isCleaned && (
                <span className="px-3 py-1 bg-[#F2F5F3] text-[#7C9082] rounded-full flex items-center gap-1">
                  <CheckCircle2 size={10} /> Cleaned
                </span>
              )}
            </div>
          )}
          <button onClick={handleDownloadCSV} disabled={!currentDataset || downloadingCsv}
            className="w-full btn-nd btn-nd-primary py-3 flex items-center justify-center gap-2">
            {downloadingCsv ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            {downloadingCsv ? 'Downloading…' : 'Download CSV'}
          </button>
        </div>

        {/* PDF */}
        <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform">
          <div className="w-14 h-14 rounded-2xl bg-[#F9F6F2] text-[#D4A373] flex items-center justify-center">
            <FileText size={26} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">PDF Quality Report</h3>
            <p className="text-gray-500 text-xs font-medium">Publication-ready report with scores, issues, column profiles & cleaning log</p>
          </div>
          {currentDataset && (
            <div className="flex gap-3 text-xs font-semibold text-gray-500">
              <span className="px-3 py-1 bg-gray-50 rounded-full">PDF Document</span>
              <span className="px-3 py-1 bg-gray-50 rounded-full">Full Report</span>
            </div>
          )}
          <button onClick={handleDownloadPDF} disabled={!currentDataset || downloadingPdf}
            className="w-full btn-nd py-3 flex items-center justify-center gap-2 text-white"
            style={{ background: '#D4A373' }}>
            {downloadingPdf ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
            {downloadingPdf ? 'Generating PDF…' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      {/* ── Quality Report Section ────────────────────────────────────── */}
      {scores ? (
        <>
          {/* Tab Bar */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
            {[
              { id: 'overview', label: 'Overview',     icon: BarChart2 },
              { id: 'columns',  label: 'Column Detail', icon: Table },
              { id: 'issues',   label: `Issues (${issues.length})`, icon: AlertTriangle },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
              {/* Score Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall */}
                <NordicCard title="Overall Quality Score" icon={ShieldCheck} color={overall >= 80 ? 'sage' : overall >= 60 ? 'mustard' : 'terra'}>
                  <div className="flex flex-col items-center py-4 gap-4">
                    <ScoreRing score={overall} color={scoreColor} />
                    {hasAfter && overallPrev !== null && (
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="text-gray-400">Before: {overallPrev}%</span>
                        <ArrowRight size={12} className="text-gray-300" />
                        <span style={{ color: scoreColor }}>After: {overall}%</span>
                        <span className="text-[#7C9082] font-bold">▲+{overall - overallPrev}</span>
                      </div>
                    )}
                    <div className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                      overall >= 80 ? 'bg-[#F2F5F3] text-[#7C9082]' : overall >= 60 ? 'bg-[#FBF5EC] text-[#D4A373]' : 'bg-[#FAF0EE] text-[#C88272]'
                    }`}>
                      {overall >= 80 ? 'Excellent' : overall >= 60 ? 'Needs Attention' : 'Critical Issues'}
                    </div>
                  </div>
                </NordicCard>

                {/* Before / After Summary */}
                <NordicCard title="Dataset Summary" icon={Layers} color="dusty">
                  <div className="flex flex-col gap-3 mt-2">
                    {[
                      { label: 'Total Rows',    val: currentDataset?.rows ?? '—' },
                      { label: 'Total Columns', val: currentDataset?.cols ?? '—' },
                      { label: 'Missing Cells', val: totalMissing,   color: totalMissing > 0 ? '#C88272' : '#7C9082' },
                      { label: 'Outliers',      val: totalOutliers,  color: totalOutliers > 0 ? '#D4A373' : '#7C9082' },
                      { label: 'Duplicates',    val: totalDuplicates, color: totalDuplicates > 0 ? '#C88272' : '#7C9082' },
                      { label: 'Issues Found',  val: issues.length,  color: issues.length > 0 ? '#D4A373' : '#7C9082' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">{r.label}</span>
                        <span className="font-bold" style={{ color: r.color || '#1a1a1a' }}>{r.val}</span>
                      </div>
                    ))}
                    {currentDataset?.isCleaned && (
                      <div className="mt-1 p-2 bg-[#F2F5F3] rounded-xl text-xs text-[#7C9082] font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Cleaning operations applied
                      </div>
                    )}
                  </div>
                </NordicCard>

                {/* Quick Stats */}
                <NordicCard title="Quality Flags" icon={Eye} color="terra">
                  <div className="flex flex-col gap-3 mt-2">
                    {[
                      { label: 'HIGH severity issues',   val: issues.filter(i => i.severity === 'HIGH').length,   color: '#C88272' },
                      { label: 'MEDIUM severity issues', val: issues.filter(i => i.severity === 'MEDIUM').length, color: '#D4A373' },
                      { label: 'LOW severity issues',    val: issues.filter(i => i.severity === 'LOW').length,    color: '#7C9082' },
                      { label: 'Columns with missing',   val: columns.filter(c => c.missing_pct > 0).length,      color: '#C88272' },
                      { label: 'Columns with outliers',  val: columns.filter(c => (c.outliers_iqr || 0) > 0).length, color: '#D4A373' },
                      { label: 'Constant columns',       val: columns.filter(c => c.constant).length,             color: '#C88272' },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">{r.label}</span>
                        <span className="font-bold" style={{ color: r.val > 0 ? r.color : '#7C9082' }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </NordicCard>
              </div>

              {/* Dimension Bars — Before vs After */}
              <NordicCard title={hasAfter ? 'Quality Dimensions — Before vs After Cleaning' : 'Quality Dimensions'} icon={TrendingUp} color="sage">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5 mt-3">
                  {DIMS.map(d => (
                    <DimBar key={d.key} label={d.label} color={d.color}
                      before={beforeScores ? Math.round(beforeScores[d.key] ?? 0) : Math.round(scores[d.key] ?? 0)}
                      after={hasAfter ? Math.round(scores[d.key] ?? 0) : null} />
                  ))}
                </div>
                {hasAfter && (
                  <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block" style={{ background: '#7A8B9955' }} />Before</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full inline-block bg-[#7A8B99]" />After</span>
                  </div>
                )}
              </NordicCard>
            </motion.div>
          )}

          {/* ── COLUMN DETAIL TAB ── */}
          {activeTab === 'columns' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <NordicCard title={`Column Profiles (${columns.length} columns)`} icon={Table} color="sage">
                <div className="overflow-x-auto mt-3">
                  <table>
                    <thead>
                      <tr>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Missing %</th>
                        <th>Outliers (IQR)</th>
                        <th>Duplicates</th>
                        <th>Skewness</th>
                        <th>Unique Count</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((c, i) => {
                        const hasProblem = c.missing_pct > 0 || (c.outliers_iqr || 0) > 0 || c.constant;
                        return (
                          <tr key={i}>
                            <td className="font-semibold text-gray-800">{c.column_name}</td>
                            <td>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{c.dtype || '—'}</span>
                            </td>
                            <td>
                              <span className={`font-semibold ${c.missing_pct > 10 ? 'text-red-600' : c.missing_pct > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                {c.missing_pct != null ? `${c.missing_pct.toFixed(1)}%` : '—'}
                              </span>
                            </td>
                            <td>
                              <span className={`font-semibold ${(c.outliers_iqr || 0) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                {c.outliers_iqr ?? '—'}
                              </span>
                            </td>
                            <td className="text-gray-500">{c.duplicate_count ?? '—'}</td>
                            <td className="text-gray-500">{c.skewness != null ? c.skewness.toFixed(2) : '—'}</td>
                            <td className="text-gray-500">{c.unique_count ?? '—'}</td>
                            <td>
                              {c.constant ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Constant</span>
                              ) : hasProblem ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Issues Found</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#F2F5F3] text-[#7C9082]">Clean</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </NordicCard>
            </motion.div>
          )}

          {/* ── ISSUES TAB ── */}
          {activeTab === 'issues' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <NordicCard title={`Identified Issues (${issues.length})`} icon={AlertTriangle} color="terra">
                {issues.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center gap-3">
                    <CheckCircle2 size={40} className="text-[#7C9082]" />
                    <p className="text-gray-500 font-medium">No issues detected — dataset looks clean!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-3">
                    <table>
                      <thead>
                        <tr>
                          <th>Column</th>
                          <th>Type</th>
                          <th>Issue Detected</th>
                          <th>Missing %</th>
                          <th>Outliers</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.map((iss, i) => (
                          <tr key={i}>
                            <td className="font-semibold text-gray-800">{iss.col}</td>
                            <td>
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{iss.dtype}</span>
                            </td>
                            <td className="text-gray-600">{iss.issue}</td>
                            <td>
                              <span className={`font-semibold ${iss.missing_pct > 10 ? 'text-red-600' : iss.missing_pct > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                                {iss.missing_pct > 0 ? `${iss.missing_pct.toFixed(1)}%` : '—'}
                              </span>
                            </td>
                            <td className={`font-semibold ${iss.outliers > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                              {iss.outliers || '—'}
                            </td>
                            <td>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${SEV[iss.severity] || 'bg-gray-100 text-gray-600'}`}>
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
            </motion.div>
          )}
        </>
      ) : (
        /* ── No scan yet ── */
        currentDataset && (
          <div className="flex flex-col items-center justify-center py-16 gap-5 bg-white rounded-3xl shadow-soft border border-gray-100 text-center">
            <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No Quality Data Yet</h3>
              <p className="text-gray-400 text-sm font-medium max-w-sm">
                Click "Run Quality Scan" to generate a full before/after quality report with dimension scores, column profiles, and issue breakdown.
              </p>
            </div>
            <button onClick={runScan} disabled={scanning} className="btn-nd btn-nd-sage gap-2">
              {scanning ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Run Quality Scan
            </button>
          </div>
        )
      )}
    </div>
  );
}
