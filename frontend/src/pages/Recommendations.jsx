/**
 * Nordic Recommendations
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, RefreshCw, Zap, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import { getRecommendations, cleanDataset } from '../api/client';
import AIChat from '../components/AIChat';
import toast from 'react-hot-toast';

const FILTERS = ['All', 'Missing', 'Outlier', 'Scaling', 'Structural'];
const CAT_COLOR = { missing: '#7C9082', outlier: '#D4A373', encoding: '#C88272', scaling: '#7A8B99', structural: '#C88272' };

function RecCard({ rec, index, applied, onApply, applying }) {
  const [open, setOpen] = useState(false);
  const ac = CAT_COLOR[rec.category?.toLowerCase()] || '#7C9082';

  // Fix field name: backend returns rec.technique (or rec.recommendation fallback)
  const techLabel = rec.technique || rec.recommendation || 'Auto Fix';

  // Fix unformatted float: format to clean integer percentage
  const conf = typeof rec.confidence === 'number'
    ? (rec.confidence <= 1 ? Math.round(rec.confidence * 100) : Math.round(rec.confidence))
    : 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-3xl p-6 transition-all duration-300 ${applied ? 'border-2 border-[#7C9082]' : 'shadow-soft border border-gray-100'}`}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: ac + '18', color: ac }}>
              {rec.category || 'Issue'}
            </span>
            <span className="text-xl font-bold text-gray-900">{rec.column}</span>
            {applied && <CheckCircle size={20} className="text-[#7C9082]" />}
          </div>

          <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-600">
            <AlertTriangle size={16} className="text-[#C88272]" />
            {rec.reason || rec.problem || 'Detected anomaly'}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 font-medium">Recommended fix:</span>
            <span className="px-4 py-1.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-800 border border-gray-200 shadow-sm">
              ✨ {techLabel}
            </span>
          </div>
        </div>

        <div className="w-56 p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            <span>Confidence</span>
            <span style={{ color: ac }}>{conf}%</span>
          </div>
          <div className="progress-bg mb-4">
            <motion.div className="progress-fill" style={{ background: ac }}
              initial={{ width: 0 }} animate={{ width: `${conf}%` }} transition={{ delay: index * 0.1 + 0.3 }} />
          </div>
          <button
            onClick={onApply}
            disabled={applied || applying}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              applied ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'text-white hover:opacity-90'
            }`}
            style={!applied ? { background: ac } : {}}
          >
            {applying ? 'Applying...' : applied ? 'Applied' : 'Apply Fix'}
          </button>
        </div>
      </div>

      {(rec.reason || (rec.advantages && rec.advantages.length > 0)) && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            <strong className="text-gray-900">Why?</strong> {rec.reason}
          </p>
          {(rec.advantages?.length > 0 || rec.disadvantages?.length > 0) && (
            <>
              <button onClick={() => setOpen(o => !o)} className="text-sm font-semibold text-gray-400 hover:text-gray-800 flex items-center gap-1 transition-colors">
                {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {open ? 'Hide details' : 'Show details'}
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-6 mt-4 p-5 bg-[#F7F6F3] rounded-2xl text-sm">
                      <div>
                        <div className="font-bold text-[#7C9082] mb-2 flex items-center gap-2">Pros</div>
                        <ul className="space-y-1 text-gray-600">
                          {(rec.advantages || []).map((a, i) => <li key={i}>• {a}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="font-bold text-[#C88272] mb-2 flex items-center gap-2">Cons</div>
                        <ul className="space-y-1 text-gray-600">
                          {(rec.disadvantages || []).map((d, i) => <li key={i}>• {d}</li>)}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Recommendations() {
  const { currentDataset, recommendations: stored, setRecommendations, setDataset } = useAppStore();
  const [recs, setRecs]       = useState(stored || []);
  const [filter, setFilter]   = useState('All');
  const [applied, setApplied] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [applyingIdx, setApplyingIdx] = useState(null);

  useEffect(() => {
    if (currentDataset?.id && (!stored || stored.length === 0)) {
      fetchRecs();
    } else if (stored?.length) {
      setRecs(stored);
    }
  }, [currentDataset?.id]);

  const fetchRecs = async () => {
    if (!currentDataset?.id) return;
    setLoading(true);
    try {
      const res = await getRecommendations(currentDataset.id);
      setRecs(res.data || []);
      setRecommendations(res.data || []);
    } catch (err) {
      toast.error('Failed to load recommendations');
      setRecs([]);
    } finally {
      setLoading(false);
    }
  };

  const applyOne = async (rec, index) => {
    if (!currentDataset?.id) return toast.error('No dataset loaded');
    const tech = rec.technique || rec.recommendation || 'mean_imputation';
    const ops = [{ column: rec.column, operation: tech, params: {} }];
    setApplyingIdx(index);
    try {
      const res = await cleanDataset(currentDataset.id, { operations: ops });
      setDataset({
        ...currentDataset,
        rows: res.data.cleaned_rows ?? currentDataset.rows,
        cols: res.data.cleaned_cols ?? currentDataset.cols,
        preview: res.data.original_preview || currentDataset.preview,
        cleanedPreview: res.data.preview,
        delta: res.data.delta,
        isCleaned: true,
      });
      setApplied(prev => new Set([...prev, index]));
      toast.success(`Applied fix for ${rec.column}`);
    } catch (err) {
      console.error('Apply fix error:', err);
      toast.error('Failed to apply fix');
    } finally {
      setApplyingIdx(null);
    }
  };

  const applyAll = async () => {
    if (!currentDataset?.id) return toast.error('No dataset loaded');
    if (!filtered.length) return toast.error('No recommendations to apply');

    // Fix field name mapping for backend Pydantic schema: operation (NOT technique)
    const ops = filtered.map(r => ({
      column: r.column,
      operation: r.technique || r.recommendation || 'mean_imputation',
      params: {},
    }));

    setLoading(true);
    try {
      const res = await cleanDataset(currentDataset.id, { operations: ops });
      setDataset({
        ...currentDataset,
        rows: res.data.cleaned_rows ?? currentDataset.rows,
        cols: res.data.cleaned_cols ?? currentDataset.cols,
        preview: res.data.original_preview || currentDataset.preview,
        cleanedPreview: res.data.preview,
        delta: res.data.delta,
        isCleaned: true,
      });
      setApplied(new Set(filtered.map((_, i) => i)));
      toast.success(`Successfully applied ${filtered.length} fixes!`);
    } catch (err) {
      console.error('Apply all error:', err);
      toast.error(err?.message || 'Failed to apply fixes');
    } finally {
      setLoading(false);
    }
  };

  const filtered = recs.filter(r => filter === 'All' || (r.category && r.category.toLowerCase() === filter.toLowerCase()));

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">AI Recommendations</h2>
          <p className="text-gray-500 font-medium">
            {recs.length > 0 ? `${recs.length} suggested actions for your dataset.` : 'No dataset issues detected yet.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchRecs} disabled={loading || !currentDataset?.id} className="btn-nd btn-nd-secondary">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={applyAll} disabled={loading || !filtered.length} className="btn-nd btn-nd-primary">
            <Zap size={14} /> Apply All Fixes
          </button>
        </div>
      </div>

      {/* Filters */}
      {recs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800 shadow-sm border border-gray-100'
              }`}>
              {f}
            </button>
          ))}
        </div>
      )}

      {/* Cards list */}
      <div className="flex flex-col space-y-6">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4 text-gray-400">
            <Brain size={48} className="animate-pulse text-[#7A8B99]" />
            <p className="font-semibold text-lg">Analyzing your data...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((rec, i) => (
            <RecCard
              key={i}
              rec={rec}
              index={i}
              applied={applied.has(i)}
              applying={applyingIdx === i}
              onApply={() => applyOne(rec, i)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white rounded-3xl shadow-soft border border-gray-100">
            <Brain size={40} className="text-gray-300" />
            <h3 className="text-xl font-bold text-gray-700">No Recommendations Available</h3>
            <p className="text-gray-400 font-medium text-sm max-w-sm">
              {currentDataset ? 'Your dataset is clean or analysis needs to be refreshed.' : 'Upload a dataset to generate AI recommendations.'}
            </p>
          </div>
        )}
      </div>

      <AIChat />
    </div>
  );
}
