/**
 * Nordic Recommendations — Category-grouped with A–Y filter bar & Manual Review View
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, RefreshCw, Zap, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Filter, Search, Sparkles,
  ShieldAlert, ShieldCheck, Info, CheckSquare, Layers, Eye
} from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import CleaningProgressBar from '../components/ui/CleaningProgressBar';
import useAppStore from '../store/useAppStore';
import { getRecommendations, cleanDataset } from '../api/client';
import AIChat from '../components/AIChat';
import toast from 'react-hot-toast';

// ── Category metadata A–Y ───────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',   label: 'All',                    color: '#7C9082' },
  { id: 'A',     label: 'A. Data Profiling',       color: '#7A8B99' },
  { id: 'B',     label: 'B. Missing Data',         color: '#C88272' },
  { id: 'C',     label: 'C. Duplicates',           color: '#D4A373' },
  { id: 'D',     label: 'D. Data Types',           color: '#7C9082' },
  { id: 'E',     label: 'E. Numerical',            color: '#7A8B99' },
  { id: 'F',     label: 'F. Outliers',             color: '#C88272' },
  { id: 'G',     label: 'G. Categorical',          color: '#D4A373' },
  { id: 'H',     label: 'H. Text',                 color: '#7C9082' },
  { id: 'I',     label: 'I. Date & Time',          color: '#7A8B99' },
  { id: 'J',     label: 'J. Units',                color: '#C88272' },
  { id: 'K',     label: 'K. Validation',           color: '#D4A373' },
  { id: 'L',     label: 'L. Inconsistent',         color: '#7C9082' },
  { id: 'M',     label: 'M. Contacts',             color: '#7A8B99' },
  { id: 'N',     label: 'N. Integration',          color: '#C88272' },
  { id: 'O',     label: 'O. Transformation',       color: '#D4A373' },
  { id: 'P',     label: 'P. Skewness',             color: '#7C9082' },
  { id: 'Q',     label: 'Q. Imbalanced',           color: '#7A8B99' },
  { id: 'R',     label: 'R. Noise',                color: '#C88272' },
  { id: 'S',     label: 'S. Features',             color: '#D4A373' },
  { id: 'T',     label: 'T. Encoding',             color: '#7C9082' },
  { id: 'U',     label: 'U. Leakage',              color: '#7A8B99' },
  { id: 'V',     label: 'V. Privacy',              color: '#C88272' },
  { id: 'W',     label: 'W. Time-series',          color: '#D4A373' },
  { id: 'X',     label: 'X. Image/Specific',       color: '#7C9082' },
  { id: 'Y',     label: 'Y. Monitoring',           color: '#7A8B99' },
];

function getCategoryInfo(categoryStr) {
  if (!categoryStr) return { id: '?', label: 'Other', color: '#9CA3AF' };
  const letter = categoryStr.trim().toUpperCase().charAt(0);
  return CATEGORIES.find(c => c.id === letter) || { id: letter, label: categoryStr, color: '#9CA3AF' };
}

function getCategoryColor(categoryStr) { return getCategoryInfo(categoryStr).color; }
function getCategoryLetter(categoryStr) { return getCategoryInfo(categoryStr).id; }

const isInformational = (rec) => {
  const tech = (rec?.technique || '').toLowerCase();
  const cat = (rec?.category || '').toLowerCase();
  return (
    cat.startsWith('a.') ||
    cat.includes('profiling') ||
    tech.includes('profiling') ||
    tech.includes('summary')
  );
};

const MANUAL_REVIEW_OPS = new Set([
  'robust_scaling', 'standard_scaling', 'minmax_scaling', 'max_abs_scaling',
  'log_transformation', 'log_transform', 'log', 'power_transformation', 'power_transform',
  'sqrt_transformation', 'sqrt_transform', 'sqrt', 'quantile_transformation', 'quantile_transform',
  'yeo_johnson_transformation', 'yeo_johnson', 'box_cox',
  'moving_average_smoothing', 'moving_average', 'ma_smooth', 'rolling_median_smoothing', 'rolling_median', 'median_smooth',
  'label_encoding', 'label_encode', 'one_hot_encoding', 'onehot', 'one_hot',
  'ordinal_encoding', 'ordinal_encode', 'binary_encoding', 'binary_encode',
  'frequency_encoding', 'freq_encode', 'target_encoding', 'target_encode',
  'smote', 'smote_oversample', 'random_oversample', 'random_undersample', 'binning', 'discretize',
  'pseudonymize', 'pseudonymization', 'remove_pii', 'mask_data',
  'delete_column', 'drop_column', 'delete_col',
  'delete_column_(id_column)', 'delete_column_id_column', 'delete_id_column',
  'delete_rows_with_missing', 'drop_missing', 'listwise_deletion',
  'iqr_outlier_removal', 'iqr_outlier', 'iqr',
  'z_score_outlier_removal', 'zscore_outlier_removal', 'zscore',
  'mad_outlier_removal', 'isolation_forest', 'lof_outlier_removal',
  'rare_category_grouping', 'merge_rare_categories', 'rare_categories', 'group_rare',
  'fuzzy_deduplication', 'fuzzy_dedup', 'fuzzy_duplicate_detection',
]);

const isManualReview = (rec) => {
  if (!rec || isInformational(rec)) return false;
  const tech = (rec?.technique || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  return MANUAL_REVIEW_OPS.has(tech);
};

// ── Single Recommendation Card ───────────────────────────────────────────────
function RecCard({ rec, index, applied, onApply, applying }) {
  const [open, setOpen] = useState(false);
  const color = getCategoryColor(rec.category);
  const letter = getCategoryLetter(rec.category);
  const techLabel = rec.technique || rec.recommendation || 'Auto Fix';
  const isInfo = isInformational(rec);
  const needsReview = isManualReview(rec);
  const conf = typeof rec.confidence === 'number'
    ? (rec.confidence <= 1 ? Math.round(rec.confidence * 100) : Math.round(rec.confidence))
    : 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.3) }}
      className={`bg-white rounded-3xl p-6 transition-all duration-300 ${
        applied
          ? 'border-2 border-[#7C9082] bg-emerald-50/10'
          : needsReview
          ? 'shadow-soft border-2 border-amber-200/80 hover:border-amber-400'
          : 'shadow-soft border border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {/* Category badge */}
            <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shadow-xs"
              style={{ background: color }}>
              {letter}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
              style={{ background: color + '18', color }}>
              {rec.category || 'Quality Insight'}
            </span>
            <span className="text-xl font-bold text-gray-900">{rec.column || 'Dataset'}</span>
            
            {needsReview && (
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <ShieldAlert size={12} className="text-amber-600" />
                Manual Review Needed
              </span>
            )}
            
            {applied && (
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle size={12} className="text-emerald-600" />
                Applied
              </span>
            )}
          </div>

          {/* Reason */}
          <div className="flex items-start gap-2 mb-4 text-sm font-medium text-gray-600">
            <AlertTriangle size={16} className={needsReview ? "text-amber-600 mt-0.5 flex-shrink-0" : "text-[#C88272] mt-0.5 flex-shrink-0"} />
            <span>{rec.reason || rec.problem || 'Detected anomaly'}</span>
          </div>

          {/* Technique */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400 font-medium">{isInfo ? 'Insight:' : 'Proposed Action:'}</span>
            <span className={`px-4 py-1.5 rounded-xl text-sm font-bold border shadow-sm ${
              needsReview
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-gray-50 text-gray-800 border-gray-200'
            }`}>
              ✨ {techLabel}
            </span>
          </div>
        </div>

        {/* Confidence panel */}
        <div className="w-52 p-5 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0">
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            <span>{isInfo ? 'Profile Score' : 'Confidence'}</span>
            <span style={{ color: needsReview ? '#D97706' : color }}>{conf}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: needsReview ? '#D97706' : color }}
              initial={{ width: 0 }}
              animate={{ width: `${conf}%` }}
              transition={{ duration: 0.8, delay: index * 0.02 }}
            />
          </div>
          {isInfo ? (
            <div className="w-full py-2.5 text-center rounded-xl text-xs font-bold bg-[#F2F5F3] text-[#7C9082] border border-[#7C9082]/20">
              ✓ Profiling Insight
            </div>
          ) : (
            <button
              onClick={() => onApply(rec)}
              disabled={applied || applying}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center gap-1.5 ${
                applied
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : needsReview
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                  : 'text-white'
              }`}
              style={!applied && !needsReview ? { background: color } : undefined}
            >
              {applied ? (
                <>✓ Applied</>
              ) : applying ? (
                <>Applying…</>
              ) : needsReview ? (
                <>
                  <Eye size={13} />
                  Review & Apply
                </>
              ) : (
                <>⚡ Apply Fix</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expandable details */}
      {(rec.advantages?.length > 0 || rec.disadvantages?.length > 0 || rec.alternatives?.length > 0) && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {open ? 'Hide technical details' : 'View technical details (advantages, consequences, alternatives)'}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  {rec.advantages?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-[#7C9082] uppercase mb-2">✅ Advantages</div>
                      <ul className="space-y-1">
                        {rec.advantages.map((a, i) => <li key={i} className="text-xs text-gray-600">• {a}</li>)}
                      </ul>
                    </div>
                  )}
                  {rec.disadvantages?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-amber-700 uppercase mb-2">⚠️ Review Considerations</div>
                      <ul className="space-y-1">
                        {rec.disadvantages.map((d, i) => <li key={i} className="text-xs text-amber-900 bg-amber-50 p-1.5 rounded-lg border border-amber-200/60 mb-1">{d}</li>)}
                      </ul>
                    </div>
                  )}
                  {rec.alternatives?.length > 0 && (
                    <div>
                      <div className="text-xs font-bold text-[#D4A373] uppercase mb-2">🔄 Alternatives</div>
                      <ul className="space-y-1">
                        {rec.alternatives.map((alt, i) => <li key={i} className="text-xs text-gray-600">• {alt}</li>)}
                      </ul>
                    </div>
                  )}
                  {rec.expected_improvement && (
                    <div className="md:col-span-3">
                      <div className="text-xs font-bold text-[#7A8B99] uppercase mb-1">📈 Expected Result</div>
                      <div className="text-xs text-gray-600">{rec.expected_improvement}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Recommendations() {
  const { currentDataset, analysisResult, recommendations, setRecommendations, setDataset, appliedPipeline, setAppliedPipeline } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [applied, setApplied] = useState(new Set());
  const [cleanProgress, setCleanProgress] = useState(currentDataset?.isCleaned ? 100 : 0);
  const [cleanStatus, setCleanStatus]   = useState(currentDataset?.isCleaned ? 'completed' : 'idle');
  const [currentStepText, setCurrentStepText] = useState('');
  const [viewScope, setViewScope] = useState('all'); // 'all' | 'safe' | 'manual' | 'profiling'
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecs = async () => {
    if (!currentDataset?.id) return;
    setLoading(true);
    try {
      const res = await getRecommendations(currentDataset.id);
      setRecommendations(res.data);
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to fetch recommendations';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentDataset?.id && (!recommendations || recommendations.length === 0)) {
      fetchRecs();
    }
  }, [currentDataset?.id]);

  const allRecs = recommendations || [];

  const profilingRecs = useMemo(() => allRecs.filter(r => isInformational(r)), [allRecs]);
  const actionableRecs = useMemo(() => allRecs.filter(r => !isInformational(r)), [allRecs]);
  const manualReviewRecs = useMemo(() => allRecs.filter(r => isManualReview(r)), [allRecs]);
  const safeAutoRecs = useMemo(() => allRecs.filter(r => !isInformational(r) && !isManualReview(r)), [allRecs]);

  // Safe pending count for Apply All Fixes button
  const safePendingCount = useMemo(() => {
    return safeAutoRecs.filter(r => !applied.has(`${r.column}-${r.technique}`)).length;
  }, [safeAutoRecs, applied]);

  const manualPendingCount = useMemo(() => {
    return manualReviewRecs.filter(r => !applied.has(`${r.column}-${r.technique}`)).length;
  }, [manualReviewRecs, applied]);

  const handleApplyAll = async () => {
    if (!currentDataset?.id || safePendingCount === 0) {
      toast('No pending auto-fixable operations.', { icon: 'ℹ️' });
      return;
    }
    setApplyingAll(true);

    const pending = safeAutoRecs.filter(r => !applied.has(`${r.column}-${r.technique}`));

    const ops = pending.map(r => ({
      column: r.column,
      operation: r.technique?.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_') || 'auto',
      technique: r.technique,
      params: {}
    }));

    const combinedOps = [...(appliedPipeline || []), ...ops];
    setCleanStatus('cleaning');
    setCleanProgress(10);
    setCurrentStepText('Applying safe data cleaning operations (imputation, deduplication, text normalization)...');

    const timer = setInterval(() => {
      setCleanProgress(prev => {
        if (prev < 40) {
          setCurrentStepText('Imputing missing values & normalizing text...');
          return prev + 12;
        }
        if (prev < 75) {
          setCurrentStepText('Standardizing categories & formatting fields...');
          return prev + 7;
        }
        if (prev < 90) {
          setCurrentStepText('Streaming dataset chunks through high-speed engine...');
          return prev + 3;
        }
        if (prev < 98) {
          setCurrentStepText('Streaming multi-million rows & writing cleaned output...');
          return Math.min(98, prev + 0.5);
        }
        return prev;
      });
    }, 350);

    try {
      const res = await cleanDataset(currentDataset.id, { operations: combinedOps });
      clearInterval(timer);
      setCleanProgress(100);
      setCleanStatus('completed');
      setCurrentStepText('Safe fixes applied successfully! 100% clean.');
      if (res?.data) {
        setDataset({
          ...currentDataset,
          rows: res.data.cleaned_rows ?? currentDataset.rows,
          cols: res.data.cleaned_cols ?? currentDataset.cols,
          preview: res.data.original_preview || currentDataset.preview,
          cleanedPreview: res.data.preview,
          delta: res.data.delta,
          isCleaned: true,
        });
      }
      setAppliedPipeline(combinedOps);
      const newApplied = new Set(applied);
      pending.forEach(r => newApplied.add(`${r.column}-${r.technique}`));
      setApplied(newApplied);

      if (manualPendingCount > 0) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <span className="font-bold text-gray-900">
              ✅ Applied {pending.length} safe fixes!
            </span>
            <span className="text-xs text-amber-800">
              {manualPendingCount} operations remain for manual review (scaling, encoding, column drop).
            </span>
            <button
              onClick={() => {
                setViewScope('manual');
                toast.dismiss(t.id);
              }}
              className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-extrabold hover:bg-amber-700 text-center"
            >
              View {manualPendingCount} Manual Review Fixes →
            </button>
          </div>
        ), { duration: 8000 });
      } else {
        toast.success(`✅ Applied all ${pending.length} fixes successfully!`);
      }
    } catch (err) {
      clearInterval(timer);
      setCleanStatus('idle');
      setCleanProgress(0);
      toast.error(err?.response?.data?.detail || err?.message || 'Some fixes could not be applied.');
    } finally {
      setApplyingAll(false);
    }
  };

  const handleApplyAllManual = async () => {
    if (!currentDataset?.id || manualPendingCount === 0) {
      return toast.error('No manual review fixes pending.');
    }
    setApplyingAll(true);

    const pending = manualReviewRecs.filter(r => !applied.has(`${r.column}-${r.technique}`));
    const ops = pending.map(r => ({
      column: r.column,
      operation: r.technique?.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_') || 'auto',
      technique: r.technique,
      params: {}
    }));

    const combinedOps = [...(appliedPipeline || []), ...ops];
    try {
      const res = await cleanDataset(currentDataset.id, { operations: combinedOps });
      if (res?.data) {
        setDataset({
          ...currentDataset,
          rows: res.data.cleaned_rows ?? currentDataset.rows,
          cols: res.data.cleaned_cols ?? currentDataset.cols,
          preview: res.data.original_preview || currentDataset.preview,
          cleanedPreview: res.data.preview,
          delta: res.data.delta,
          isCleaned: true,
        });
      }
      setAppliedPipeline(combinedOps);
      const newApplied = new Set(applied);
      pending.forEach(r => newApplied.add(`${r.column}-${r.technique}`));
      setApplied(newApplied);
      toast.success(`✅ Applied all ${pending.length} manual review transformations!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to apply manual review fixes.');
    } finally {
      setApplyingAll(false);
    }
  };

  const handleApply = async (rec) => {
    if (!currentDataset?.id) return;
    const key = `${rec.column}-${rec.technique}`;
    setApplying(key);
    try {
      const operation = rec.technique?.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_') || 'auto';
      const newOp = {
        column: rec.column,
        operation,
        technique: rec.technique,
        params: {}
      };
      const combinedOps = [...(appliedPipeline || []), newOp];
      const res = await cleanDataset(currentDataset.id, {
        operations: combinedOps
      });
      if (res?.data) {
        setDataset({
          ...currentDataset,
          rows: res.data.cleaned_rows ?? currentDataset.rows,
          cols: res.data.cleaned_cols ?? currentDataset.cols,
          preview: res.data.original_preview || currentDataset.preview,
          cleanedPreview: res.data.preview,
          delta: res.data.delta,
          isCleaned: true,
        });
      }
      setAppliedPipeline(combinedOps);
      setApplied(prev => new Set([...prev, key]));
      toast.success(`✅ ${rec.technique} applied to "${rec.column}"`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || `Failed to apply: ${rec.technique}`);
    } finally {
      setApplying(null);
    }
  };

  // Derive unique categories from loaded recs
  const presentCategories = useMemo(() => {
    if (!allRecs?.length) return [];
    const letters = new Set(allRecs.map(r => getCategoryLetter(r.category)));
    return CATEGORIES.filter(c => c.id === 'all' || letters.has(c.id));
  }, [allRecs]);

  // Filter recs by scope + category + search
  const filtered = useMemo(() => {
    if (!allRecs) return [];
    return allRecs.filter(r => {
      // 1. Scope filter
      if (viewScope === 'safe' && (isInformational(r) || isManualReview(r))) return false;
      if (viewScope === 'manual' && !isManualReview(r)) return false;
      if (viewScope === 'profiling' && !isInformational(r)) return false;

      // 2. Category filter
      const matchCat = activeCategory === 'all' || getCategoryLetter(r.category) === activeCategory;

      // 3. Search query
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (r.column || '').toLowerCase().includes(q)
        || (r.technique || '').toLowerCase().includes(q)
        || (r.reason || '').toLowerCase().includes(q)
        || (r.category || '').toLowerCase().includes(q);
        
      return matchCat && matchSearch;
    });
  }, [allRecs, viewScope, activeCategory, searchQuery]);

  // Group filtered by category letter
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach(r => {
      const letter = getCategoryLetter(r.category);
      const cat = CATEGORIES.find(c => c.id === letter) || { label: r.category || 'Other', color: '#7C9082', id: letter };
      if (!groups[letter]) groups[letter] = { meta: cat, items: [] };
      groups[letter].items.push(r);
    });
    return Object.values(groups).sort((a, b) => a.meta.id.localeCompare(b.meta.id));
  }, [filtered]);

  if (!currentDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
          <Brain size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">No Dataset Loaded</h2>
        <p className="text-gray-500 font-medium">Upload a dataset first to get AI recommendations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">AI Recommendations</h2>
          <p className="text-gray-500 font-medium">
            {allRecs.length
              ? `${allRecs.length} recommendations (${safeAutoRecs.length} safe auto-fixes · ${manualReviewRecs.length} manual reviews · ${profilingRecs.length} profiling insights)`
              : 'Run the AI engine to get cleaning recommendations.'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {safePendingCount > 0 && (
            <button
              onClick={handleApplyAll}
              disabled={applyingAll}
              className="btn-nd shadow-soft gap-2 font-bold text-white transition-all disabled:opacity-60"
              style={{ background: '#7C9082' }}
            >
              <Zap size={16} className={applyingAll ? 'animate-pulse' : ''} />
              {applyingAll ? 'Applying Safe Fixes…' : `⚡ Apply Safe Fixes (${safePendingCount})`}
            </button>
          )}

          {viewScope === 'manual' && manualPendingCount > 0 && (
            <button
              onClick={handleApplyAllManual}
              disabled={applyingAll}
              className="btn-nd shadow-soft gap-2 font-bold text-white transition-all bg-amber-600 hover:bg-amber-700"
            >
              <CheckSquare size={16} />
              {applyingAll ? 'Applying…' : `Apply All Manual Reviews (${manualPendingCount})`}
            </button>
          )}

          <button onClick={fetchRecs} disabled={loading}
            className="btn-nd btn-nd-primary shadow-soft gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analysing…' : 'Refresh'}
          </button>
        </div>
      </motion.div>

      {/* ── Top Scope Filter Tabs ── */}
      <div className="flex items-center gap-2 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/80 flex-wrap">
        <button
          onClick={() => setViewScope('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            viewScope === 'all'
              ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers size={14} />
          All Recommendations
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-200 text-gray-700">
            {allRecs.length}
          </span>
        </button>

        <button
          onClick={() => setViewScope('safe')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            viewScope === 'safe'
              ? 'bg-[#7C9082] text-white shadow-sm'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <ShieldCheck size={14} />
          ⚡ Safe Auto-Fixes
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            viewScope === 'safe' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {safeAutoRecs.length}
          </span>
        </button>

        <button
          onClick={() => setViewScope('manual')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            viewScope === 'manual'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-900 hover:bg-amber-50'
          }`}
        >
          <ShieldAlert size={14} />
          ⚠️ Needs Manual Review
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            viewScope === 'manual' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-950 font-black'
          }`}>
            {manualReviewRecs.length}
          </span>
        </button>

        <button
          onClick={() => setViewScope('profiling')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            viewScope === 'profiling'
              ? 'bg-[#7A8B99] text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Info size={14} />
          📊 Profiling Insights
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            viewScope === 'profiling' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {profilingRecs.length}
          </span>
        </button>
      </div>

      {/* ── Informational Banner when Manual Review is Selected ── */}
      {viewScope === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl flex items-start gap-4 shadow-sm"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <ShieldAlert size={22} />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-extrabold text-amber-950 tracking-tight mb-1">
              Why do these {manualReviewRecs.length} recommendations require manual review?
            </h4>
            <p className="text-xs text-amber-900/80 font-medium leading-relaxed mb-3">
              Unlike safe data repairs (such as null value imputation or duplicate row deletion), these operations modify feature representations for machine learning, permanently drop columns, or transform numerical scales:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
                <span className="text-[11px] font-extrabold text-amber-900 block">🗑️ Column Deletion</span>
                <span className="text-[10px] text-gray-600">Permanently removes constant or high-cardinality ID columns.</span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
                <span className="text-[11px] font-extrabold text-amber-900 block">📐 Scaling (Robust/MinMax)</span>
                <span className="text-[10px] text-gray-600">Alters numerical values into normalized decimal units for ML.</span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
                <span className="text-[11px] font-extrabold text-amber-900 block">🏷️ Encoding (One-Hot/Label)</span>
                <span className="text-[10px] text-gray-600">Converts categorical text into numeric indicator columns.</span>
              </div>
              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80">
                <span className="text-[11px] font-extrabold text-amber-900 block">🔒 Privacy & Masking</span>
                <span className="text-[10px] text-gray-600">Hashes or masks personal identifiable information (PII).</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      {allRecs.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-soft">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder={
              viewScope === 'manual'
                ? "Search among manual review items (e.g. Robust Scaling, Delete Column)..."
                : "Search by column, technique, or category…"
            }
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 text-sm font-medium text-gray-700 outline-none bg-transparent"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-700 text-xs">✕ Clear</button>
          )}
        </div>
      )}

      {/* Category filter pills */}
      {presentCategories.length > 1 && (
        <div className="flex gap-2 flex-wrap items-center">
          <Filter size={16} className="text-gray-400 self-center" />
          {presentCategories.map(cat => {
            const count = cat.id === 'all'
              ? filtered.length
              : allRecs.filter(r => {
                  if (viewScope === 'safe' && (isInformational(r) || isManualReview(r))) return false;
                  if (viewScope === 'manual' && !isManualReview(r)) return false;
                  if (viewScope === 'profiling' && !isInformational(r)) return false;
                  return getCategoryLetter(r.category) === cat.id;
                }).length;

            if (cat.id !== 'all' && count === 0) return null;

            return (
              <button key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={activeCategory === cat.id
                  ? { background: cat.color, color: 'white' }
                  : { background: cat.color + '15', color: cat.color }}>
                {cat.label}
                <span className="ml-1 opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw size={40} className="animate-spin text-[#7C9082]" />
          <p className="text-gray-500 font-medium">AI engine analysing dataset…</p>
        </div>
      ) : grouped.length > 0 ? (
        <div className="flex flex-col gap-10">
          {grouped.map(group => (
            <div key={group.meta.id}>
              {/* Category section header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold text-white"
                  style={{ background: group.meta.color }}>
                  {group.meta.id}
                </span>
                <h3 className="text-lg font-extrabold text-gray-800">{group.meta.label}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ background: group.meta.color }}>
                  {group.items.length}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="flex flex-col gap-4">
                {group.items.map((rec, i) => {
                  const key = `${rec.column}-${rec.technique}`;
                  return (
                    <RecCard key={key} rec={rec} index={i}
                      applied={applied.has(key)}
                      applying={applying === key}
                      onApply={handleApply} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <NordicCard color="sage" className="py-16">
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <Zap size={40} className="opacity-40" />
            <p className="font-semibold text-gray-700">
              {allRecs.length > 0 ? 'No recommendations match this specific filter.' : 'No recommendations yet.'}
            </p>
            {viewScope !== 'all' && (
              <button
                onClick={() => setViewScope('all')}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl text-xs font-bold hover:bg-gray-200"
              >
                Reset to View All
              </button>
            )}
          </div>
        </NordicCard>
      )}

      {/* AI Chat */}
      <AIChat />
    </div>
  );
}
