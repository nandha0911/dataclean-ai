/**
 * Nordic Light Cleaning Dashboard
 * Features:
 *  - All 200+ techniques grouped by category A–Y
 *  - Searchable technique dropdown
 *  - Sequential pipeline builder
 *  - AI Suggestions with 1-click Add to Pipeline
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Zap, AlertTriangle, X, PlayCircle, Activity, Sparkles, CheckCircle2, Search } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import { cleanDataset, getRecommendations } from '../api/client';
import toast from 'react-hot-toast';

// ── All 200+ techniques grouped by category ──────────────────────────────────
const OPERATION_GROUPS = [
  {
    label: 'B. Missing Data',
    color: '#C88272',
    options: [
      { value: 'mean_imputation',           label: 'Mean Imputation' },
      { value: 'median_imputation',         label: 'Median Imputation' },
      { value: 'mode_imputation',           label: 'Mode Imputation' },
      { value: 'knn_imputation',            label: 'KNN Imputation' },
      { value: 'mice_imputation',           label: 'MICE Imputation' },
      { value: 'constant_imputation',       label: 'Constant Value Imputation' },
      { value: 'forward_fill',              label: 'Forward Fill' },
      { value: 'backward_fill',             label: 'Backward Fill' },
      { value: 'interpolation',             label: 'Linear Interpolation' },
      { value: 'rolling_average_imputation',label: 'Rolling Average Imputation' },
      { value: 'missing_indicator',         label: 'Missing Indicator Variable' },
      { value: 'listwise_deletion',         label: 'Listwise Deletion' },
      { value: 'delete_rows_with_missing',  label: 'Delete Rows with Missing' },
    ],
  },
  {
    label: 'C. Duplicates',
    color: '#D4A373',
    options: [
      { value: 'duplicate_removal',         label: 'Exact Duplicate Removal' },
      { value: 'keep_first_occurrence',     label: 'Keep First Occurrence' },
      { value: 'keep_last_occurrence',      label: 'Keep Last Occurrence' },
      { value: 'fuzzy_deduplication',       label: 'Fuzzy Deduplication' },
    ],
  },
  {
    label: 'D. Data Types',
    color: '#7C9082',
    options: [
      { value: 'auto_type_cast',            label: 'Auto Type Cast' },
      { value: 'boolean_conversion',        label: 'Boolean Conversion' },
      { value: 'datetime_conversion',       label: 'DateTime Conversion' },
      { value: 'category_conversion',       label: 'Category Conversion' },
      { value: 'delete_column',             label: 'Delete Column' },
    ],
  },
  {
    label: 'E. Numerical',
    color: '#7A8B99',
    options: [
      { value: 'clip_values',               label: 'Clip Values' },
      { value: 'round_values',              label: 'Round Values' },
      { value: 'decimal_correction',        label: 'Decimal Correction' },
      { value: 'remove_negative_values',    label: 'Remove Negative Values' },
      { value: 'remove_zero_values',        label: 'Remove Zero Values' },
    ],
  },
  {
    label: 'F. Outliers',
    color: '#C88272',
    options: [
      { value: 'iqr_outlier_removal',       label: 'IQR Outlier Removal' },
      { value: 'zscore_outlier_removal',    label: 'Z-Score Outlier Removal' },
      { value: 'mad_outlier_removal',       label: 'MAD Outlier Removal' },
      { value: 'modified_zscore_removal',   label: 'Modified Z-Score Removal' },
      { value: 'winsorization',             label: 'Winsorization' },
      { value: 'percentile_capping',        label: 'Percentile Capping' },
      { value: 'isolation_forest',          label: 'Isolation Forest' },
      { value: 'lof_outlier_removal',       label: 'Local Outlier Factor (LOF)' },
    ],
  },
  {
    label: 'G. Categorical',
    color: '#D4A373',
    options: [
      { value: 'standardize_gender',        label: 'Gender Standardization' },
      { value: 'standardize_text',          label: 'Text / Category Standardization' },
      { value: 'merge_rare_categories',     label: 'Merge Rare Categories' },
      { value: 'map_categories',            label: 'Map Categories' },
      { value: 'unknown_category_fill',     label: 'Fill Unknown Category' },
    ],
  },
  {
    label: 'H. Text Cleaning',
    color: '#7C9082',
    options: [
      { value: 'remove_html_tags',          label: 'Remove HTML Tags' },
      { value: 'remove_urls',               label: 'Remove URLs' },
      { value: 'remove_emails',             label: 'Remove Email Addresses' },
      { value: 'remove_punctuation',        label: 'Remove Punctuation' },
      { value: 'remove_special_characters', label: 'Remove Special Characters' },
      { value: 'strip_whitespace',          label: 'Strip Whitespace' },
      { value: 'remove_extra_spaces',       label: 'Remove Extra Spaces' },
      { value: 'lowercase_conversion',      label: 'Lowercase Conversion' },
      { value: 'uppercase_conversion',      label: 'Uppercase Conversion' },
      { value: 'unicode_normalize',         label: 'Unicode Normalization' },
      { value: 'fix_encoding',              label: 'Fix Encoding' },
    ],
  },
  {
    label: 'I. Date & Time',
    color: '#7A8B99',
    options: [
      { value: 'parse_dates',               label: 'Parse Dates' },
      { value: 'standardize_date_format',   label: 'Standardize Date Format' },
      { value: 'extract_year',              label: 'Extract Year' },
      { value: 'extract_month',             label: 'Extract Month' },
      { value: 'extract_day',               label: 'Extract Day' },
      { value: 'extract_day_of_week',       label: 'Extract Day of Week' },
    ],
  },
  {
    label: 'O. Transformation',
    color: '#D4A373',
    options: [
      { value: 'log_transformation',        label: 'Log Transformation' },
      { value: 'sqrt_transformation',       label: 'Square Root Transformation' },
      { value: 'power_transformation',      label: 'Yeo-Johnson / Box-Cox' },
      { value: 'quantile_transformation',   label: 'Quantile Transformation' },
      { value: 'binning',                   label: 'Binning (pd.cut)' },
      { value: 'discretize',               label: 'Discretize (Quantile Bins)' },
      { value: 'robust_scaling',            label: 'Robust Scaling' },
      { value: 'standard_scaling',          label: 'Z-Score Standardization' },
      { value: 'minmax_scaling',            label: 'Min-Max Normalization' },
      { value: 'max_abs_scaling',           label: 'Max-Abs Scaling' },
    ],
  },
  {
    label: 'Q. Imbalanced Data',
    color: '#7C9082',
    options: [
      { value: 'smote',                     label: 'SMOTE Oversampling' },
      { value: 'random_oversample',         label: 'Random Oversampling' },
      { value: 'random_undersample',        label: 'Random Undersampling' },
    ],
  },
  {
    label: 'R. Noise Removal',
    color: '#C88272',
    options: [
      { value: 'moving_average_smooth',     label: 'Moving Average Smoothing' },
      { value: 'rolling_median_smooth',     label: 'Rolling Median Smoothing' },
    ],
  },
  {
    label: 'T. Encoding',
    color: '#7A8B99',
    options: [
      { value: 'one_hot_encoding',          label: 'One-Hot Encoding' },
      { value: 'label_encoding',            label: 'Label Encoding' },
      { value: 'ordinal_encoding',          label: 'Ordinal Encoding' },
      { value: 'frequency_encoding',        label: 'Frequency Encoding' },
      { value: 'target_encoding',           label: 'Target Encoding' },
      { value: 'binary_encoding',           label: 'Binary Encoding' },
    ],
  },
  {
    label: 'V. Privacy',
    color: '#D4A373',
    options: [
      { value: 'mask_data',                 label: 'Mask Data (PII)' },
      { value: 'pseudonymize',              label: 'Pseudonymize (Hash)' },
      { value: 'remove_pii',               label: 'Remove PII Column' },
    ],
  },
  {
    label: 'W. Time-series',
    color: '#7C9082',
    options: [
      { value: 'remove_duplicate_timestamps', label: 'Remove Duplicate Timestamps' },
    ],
  },
];

// Flat list for lookup
const ALL_OPTIONS = OPERATION_GROUPS.flatMap(g => g.options.map(o => ({ ...o, group: g.label })));

function getLabel(val) {
  const found = ALL_OPTIONS.find(o => o.value === val || o.label === val);
  return found ? found.label : val;
}

// ── Searchable Technique Picker ───────────────────────────────────────────────
function TechniquePicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return OPERATION_GROUPS;
    const q = query.toLowerCase();
    return OPERATION_GROUPS
      .map(g => ({ ...g, options: g.options.filter(o => o.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
      .filter(g => g.options.length > 0);
  }, [query]);

  const selected = ALL_OPTIONS.find(o => o.value === value);

  return (
    <div className="relative flex-1 min-w-[240px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-left flex items-center justify-between gap-2"
      >
        <span className="truncate">{selected?.label || 'Select technique…'}</span>
        <span className="text-gray-400 text-xs">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 sticky top-0 bg-white">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search techniques…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
              onClick={e => e.stopPropagation()}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          {/* Grouped options */}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400">No techniques found</div>
            ) : (
              filtered.map(group => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider sticky top-0"
                    style={{ background: group.color + '18', color: group.color }}>
                    {group.label}
                  </div>
                  {group.options.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        value === opt.value ? 'font-bold text-[#7C9082] bg-[#F2F5F3]' : 'text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CleaningDashboard() {
  const { currentDataset, analysisResult, recommendations, setRecommendations, setDataset } = useAppStore();
  const cols = analysisResult?.columns?.map(c => c.column_name) || [];

  const [pipeline, setPipeline]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [fetchingRecs, setFetchingRecs] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [newOp, setNewOp]             = useState({ column: cols[0] || '', technique: ALL_OPTIONS[0].value });

  useEffect(() => {
    if (currentDataset?.id && (!recommendations || recommendations.length === 0)) {
      setFetchingRecs(true);
      getRecommendations(currentDataset.id)
        .then(res => { if (Array.isArray(res.data)) setRecommendations(res.data); })
        .catch(() => {})
        .finally(() => setFetchingRecs(false));
    }
  }, [currentDataset?.id]);

  useEffect(() => {
    if (cols.length > 0 && !newOp.column) setNewOp(prev => ({ ...prev, column: cols[0] }));
  }, [cols]);

  const addOperation = (column, technique) => {
    setPipeline(prev => [...prev, { column, technique, id: Date.now() + Math.random() }]);
    setShowAdd(false);
    toast.success(`Added "${getLabel(technique)}" for ${column}`);
  };

  const removeOperation = (id) => setPipeline(prev => prev.filter(p => p.id !== id));

  const addAllAiSuggestions = () => {
    if (!recommendations?.length) return toast.error('No AI suggestions available');
    const newItems = recommendations.map(rec => ({
      column: rec.column,
      technique: (rec.technique || 'mean_imputation').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'),
      id: Date.now() + Math.random(),
    }));
    setPipeline(prev => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} AI suggestions to pipeline`);
  };

  const runPipeline = async () => {
    if (!currentDataset?.id) return toast.error('No dataset loaded');
    if (!pipeline.length) return toast.error('Pipeline is empty');
    setLoading(true);
    const operationsPayload = pipeline.map(p => ({ column: p.column, operation: p.technique, params: {} }));
    try {
      const res = await cleanDataset(currentDataset.id, { operations: operationsPayload });
      setDataset({
        ...currentDataset,
        rows: res.data.cleaned_rows ?? currentDataset.rows,
        cols: res.data.cleaned_cols ?? currentDataset.cols,
        preview: res.data.original_preview || currentDataset.preview,
        cleanedPreview: res.data.preview,
        delta: res.data.delta,
        isCleaned: true,
      });
      toast.success(res.data.message || 'Pipeline executed successfully!');
      setPipeline([]);
    } catch (err) {
      toast.error(err?.message || 'Pipeline execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Data Cleaning Pipeline</h2>
          <p className="text-gray-500 font-medium">Build, review, and execute sequential cleaning operations.</p>
        </div>
        <div className="flex gap-3">
          {recommendations?.length > 0 && (
            <button onClick={addAllAiSuggestions} className="btn-nd btn-nd-secondary text-[#7C9082]">
              <Sparkles size={14} /> Add All AI Suggestions
            </button>
          )}
          <button onClick={() => setPipeline([])} disabled={!pipeline.length} className="btn-nd btn-nd-secondary text-[#C88272]">
            <Trash2 size={14} /> Clear All
          </button>
          <button onClick={runPipeline} disabled={loading || !pipeline.length} className="btn-nd btn-nd-primary shadow-soft">
            {loading ? <Activity size={16} className="animate-spin" /> : <PlayCircle size={16} />} Run Pipeline
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Pipeline builder */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <NordicCard title="Operation Sequence" icon={Zap} color="sage">
            <div className="flex flex-col gap-3 min-h-[220px] mt-2">
              <AnimatePresence>
                {pipeline.map((p, i) => (
                  <motion.div key={p.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-400 shadow-sm">{i + 1}</div>
                    <div className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200 truncate max-w-[120px]">{p.column}</div>
                    <div className="text-gray-400 font-bold">→</div>
                    <div className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-[#7C9082] border border-gray-200 flex-1 truncate">{getLabel(p.technique)}</div>
                    <button onClick={() => removeOperation(p.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#C88272] hover:bg-white transition-colors flex-shrink-0">
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {pipeline.length === 0 && !showAdd && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-medium text-sm p-8 border-2 border-dashed border-gray-200 rounded-3xl">
                  No operations scheduled. Add custom steps or pick from AI Suggestions.
                </div>
              )}

              {showAdd ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex-wrap">
                  {/* Column selector */}
                  <select
                    className="flex-1 min-w-[140px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium"
                    value={newOp.column}
                    onChange={e => setNewOp({ ...newOp, column: e.target.value })}
                  >
                    {cols.length ? cols.map(c => <option key={c} value={c}>{c}</option>) : <option value="">No columns</option>}
                  </select>

                  {/* Searchable technique picker */}
                  <TechniquePicker
                    value={newOp.technique}
                    onChange={val => setNewOp({ ...newOp, technique: val })}
                  />

                  <button onClick={() => addOperation(newOp.column, newOp.technique)} className="btn-nd btn-nd-sage px-5">
                    <Plus size={16} /> Add
                  </button>
                  <button onClick={() => setShowAdd(false)} className="btn-nd btn-nd-secondary px-4">
                    <X size={16} />
                  </button>
                </motion.div>
              ) : (
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center justify-center gap-2 w-full mt-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-800 transition-colors">
                  <Plus size={16} /> Add Custom Operation
                </button>
              )}
            </div>
          </NordicCard>
        </div>

        {/* Right: AI Suggestions + Guidelines */}
        <div className="flex flex-col gap-6">
          <NordicCard title="AI Recommended Suggestions" icon={Sparkles} color="mustard">
            <div className="flex flex-col gap-3 mt-2">
              {fetchingRecs ? (
                <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                  <Activity size={16} className="animate-spin text-[#7C9082]" /> Fetching recommendations...
                </div>
              ) : recommendations?.length > 0 ? (
                recommendations.slice(0, 6).map((rec, idx) => {
                  const tech = (rec.technique || 'mean_imputation').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
                  const col = rec.column;
                  const inPipeline = pipeline.some(p => p.column === col && p.technique === tech);
                  return (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-gray-800 text-sm truncate">{col}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-[#F2F5F3] text-[#7C9082] rounded-full whitespace-nowrap">
                          {rec.confidence ? `${Math.round(rec.confidence)}%` : 'AI'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{rec.reason || 'Recommended cleaning technique'}</p>
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="text-xs font-bold text-[#7A8B99] truncate">{rec.technique}</span>
                        <button
                          onClick={() => addOperation(col, tech)}
                          disabled={inPipeline}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 flex-shrink-0 ${
                            inPipeline ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#7C9082] text-white shadow-sm'
                          }`}
                        >
                          {inPipeline ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                          {inPipeline ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs font-medium">
                  {currentDataset ? 'Run Quality Scan to generate AI recommendations' : 'Upload dataset to view suggestions'}
                </div>
              )}
            </div>
          </NordicCard>

          <NordicCard title="Pipeline Guidelines" icon={AlertTriangle} color="terra">
            <div className="text-xs text-gray-600 font-medium space-y-3 mt-1 leading-relaxed">
              <p>• Operations execute top-to-bottom sequentially.</p>
              <p>• Use the search box to quickly find any of the 60+ techniques.</p>
              <p>• Impute missing values before removing outliers for best results.</p>
              <div className="p-3 bg-[#F8F2F0] rounded-xl text-[#C88272] border border-[#C88272] border-opacity-20 font-semibold">
                ⚠️ Pipeline execution updates the dataset immediately.
              </div>
            </div>
          </NordicCard>
        </div>
      </div>
    </div>
  );
}
