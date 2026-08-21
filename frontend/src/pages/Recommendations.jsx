/**
 * Nordic Recommendations — Category-grouped with A–Y filter bar
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, RefreshCw, Zap, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Filter, Search
} from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import { getRecommendations, cleanDataset } from '../api/client';
import AIChat from '../components/AIChat';
import toast from 'react-hot-toast';

// ── Category metadata A–Y ───────────────────────────────────────────────────
// IDs are the first letter; labels match what the backend returns
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

// ── Single Recommendation Card ───────────────────────────────────────────────
function RecCard({ rec, index, applied, onApply, applying }) {
  const [open, setOpen] = useState(false);
  const color = getCategoryColor(rec.category);
  const letter = getCategoryLetter(rec.category);
  const techLabel = rec.technique || rec.recommendation || 'Auto Fix';
  const isInfo = isInformational(rec);
  const conf = typeof rec.confidence === 'number'
    ? (rec.confidence <= 1 ? Math.round(rec.confidence * 100) : Math.round(rec.confidence))
    : 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      className={`bg-white rounded-3xl p-6 transition-all duration-300 ${applied ? 'border-2 border-[#7C9082]' : 'shadow-soft border border-gray-100'}`}
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
            {applied && <CheckCircle size={20} className="text-[#7C9082]" />}
          </div>

          {/* Reason */}
          <div className="flex items-start gap-2 mb-4 text-sm font-medium text-gray-600">
            <AlertTriangle size={16} className="text-[#C88272] mt-0.5 flex-shrink-0" />
            <span>{rec.reason || rec.problem || 'Detected anomaly'}</span>
          </div>

          {/* Technique */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400 font-medium">{isInfo ? 'Insight:' : 'Recommended fix:'}</span>
            <span className="px-4 py-1.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-800 border border-gray-200 shadow-sm">
              ✨ {techLabel}
            </span>
          </div>
        </div>

        {/* Confidence panel */}
        <div className="w-52 p-5 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0">
          <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
            <span>{isInfo ? 'Profile Score' : 'Confidence'}</span>
            <span style={{ color }}>{conf}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: 0 }}
              animate={{ width: `${conf}%` }}
              transition={{ duration: 0.8, delay: index * 0.03 }}
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
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              style={applied ? { background: '#7C908218', color: '#7C9082' } : { background: color, color: 'white' }}
            >
              {applied ? '✓ Applied' : applying ? 'Applying…' : '⚡ Apply Fix'}
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
            {open ? 'Hide details' : 'View details'}
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
                      <div className="text-xs font-bold text-[#C88272] uppercase mb-2">⚠️ Disadvantages</div>
                      <ul className="space-y-1">
                        {rec.disadvantages.map((d, i) => <li key={i} className="text-xs text-gray-600">• {d}</li>)}
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
                      <div className="text-xs font-bold text-[#7A8B99] uppercase mb-1">📈 Expected Improvement</div>
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
  const { currentDataset, analysisResult, recommendations, setRecommendations, setDataset } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(null);
  const [applyingAll, setApplyingAll] = useState(false);
  const [applied, setApplied] = useState(new Set());
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

  const actionableRecs = useMemo(() => {
    return (recommendations || []).filter(r => !isInformational(r));
  }, [recommendations]);

  const handleApplyAll = async () => {
    if (!currentDataset?.id || !actionableRecs?.length) {
      toast('No actionable cleaning operations needed.', { icon: 'ℹ️' });
      return;
    }
    setApplyingAll(true);
    const pending = actionableRecs.filter(r => {
      const key = `${r.column}-${r.technique}`;
      return !applied.has(key);
    });

    if (pending.length === 0) {
      toast.success('All actionable fixes are already applied!');
      setApplyingAll(false);
      return;
    }

    const ops = pending.map(r => ({
      column: r.column,
      operation: r.technique?.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_') || 'auto',
      technique: r.technique,
      params: {}
    }));

    try {
      const res = await cleanDataset(currentDataset.id, { operations: ops });
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
      const newApplied = new Set(applied);
      pending.forEach(r => newApplied.add(`${r.column}-${r.technique}`));
      setApplied(newApplied);
      toast.success(`✅ Applied ${pending.length} fixes successfully!`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err?.message || 'Some fixes could not be applied.');
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
      const res = await cleanDataset(currentDataset.id, {
        operations: [{
          column: rec.column,
          operation,
          technique: rec.technique,
          params: {}
        }]
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
    if (!recommendations?.length) return [];
    const letters = new Set(recommendations.map(r => getCategoryLetter(r.category)));
    return CATEGORIES.filter(c => c.id === 'all' || letters.has(c.id));
  }, [recommendations]);

  // Filter recs by category + search
  const filtered = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter(r => {
      const matchCat = activeCategory === 'all' || getCategoryLetter(r.category) === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || (r.column || '').toLowerCase().includes(q)
        || (r.technique || '').toLowerCase().includes(q)
        || (r.reason || '').toLowerCase().includes(q)
        || (r.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [recommendations, activeCategory, searchQuery]);

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

  const actionablePendingCount = useMemo(() => {
    return actionableRecs.filter(r => !applied.has(`${r.column}-${r.technique}`)).length;
  }, [actionableRecs, applied]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">AI Recommendations</h2>
          <p className="text-gray-500 font-medium">
            {recommendations?.length
              ? `${recommendations.length} recommendations across ${Math.max(1, presentCategories.length - 1)} categories (${actionableRecs.length} actionable fixes)`
              : 'Run the AI engine to get cleaning recommendations.'}
          </p>
        </div>
        <div className="flex gap-3">
          {actionableRecs?.length > 0 && (
            <button
              onClick={handleApplyAll}
              disabled={applyingAll || actionablePendingCount === 0}
              className="btn-nd shadow-soft gap-2 font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: applyingAll ? '#9aad9f' : '#7C9082' }}
            >
              <Zap size={16} className={applyingAll ? 'animate-pulse' : ''} />
              {applyingAll
                ? 'Applying Fixes…'
                : actionablePendingCount === 0
                ? '✓ All Fixes Applied'
                : `⚡ Apply All Fixes (${actionablePendingCount})`
              }
            </button>
          )}
          <button onClick={fetchRecs} disabled={loading}
            className="btn-nd btn-nd-primary shadow-soft gap-2">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analysing…' : 'Refresh'}
          </button>
        </div>
      </motion.div>

      {/* Search */}
      {recommendations?.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-soft">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by column, technique, or category…"
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
        <div className="flex gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400 self-center" />
          {presentCategories.map(cat => (
            <button key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={activeCategory === cat.id
                ? { background: cat.color, color: 'white' }
                : { background: cat.color + '15', color: cat.color }}>
              {cat.label}
              {cat.id !== 'all' && recommendations && (
                <span className="ml-1 opacity-70">
                  ({recommendations.filter(r => getCategoryLetter(r.category) === cat.id).length})
                </span>
              )}
            </button>
          ))}
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
            <p className="font-semibold">
              {recommendations?.length > 0 ? 'No results match your filter.' : 'No recommendations yet.'}
            </p>
            {!recommendations?.length && (
              <button
                onClick={fetchRecs}
                disabled={loading}
                className="btn-nd btn-nd-sage text-sm font-bold shadow-soft flex items-center gap-2"
              >
                {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{loading ? 'Running AI Engine…' : 'Run AI Analysis'}</span>
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
