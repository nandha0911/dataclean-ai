/**
 * Nordic Light Cleaning Dashboard — ALL 25 categories A–Y
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Zap, AlertTriangle, X, PlayCircle, Activity, Sparkles, CheckCircle2, Search } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import { cleanDataset, getRecommendations } from '../api/client';
import toast from 'react-hot-toast';

// ── ALL 25 categories A–Y with every technique ────────────────────────────────
const OPERATION_GROUPS = [
  {
    label: 'A. Data Profiling & Quality Assessment',
    color: '#7A8B99',
    options: [
      { value: 'data_profiling',            label: 'Data Profiling' },
      { value: 'data_auditing',             label: 'Data Auditing' },
      { value: 'data_quality_assessment',   label: 'Data Quality Assessment' },
      { value: 'schema_inspection',         label: 'Schema Inspection' },
      { value: 'data_type_inspection',      label: 'Data-Type Inspection' },
      { value: 'column_level_profiling',    label: 'Column-Level Profiling' },
      { value: 'row_level_profiling',       label: 'Row-Level Profiling' },
      { value: 'cardinality_analysis',      label: 'Cardinality Analysis' },
      { value: 'unique_value_analysis',     label: 'Unique-Value Analysis' },
      { value: 'frequency_analysis',        label: 'Frequency Analysis' },
      { value: 'distribution_analysis',     label: 'Distribution Analysis' },
      { value: 'data_profiling_summary',    label: 'Summary Statistics' },
      { value: 'data_quality_scoring',      label: 'Data-Quality Scoring' },
    ],
  },
  {
    label: 'B. Missing Data Handling',
    color: '#C88272',
    options: [
      { value: 'mean_imputation',            label: 'Mean Imputation' },
      { value: 'median_imputation',          label: 'Median Imputation' },
      { value: 'mode_imputation',            label: 'Mode Imputation' },
      { value: 'constant_imputation',        label: 'Constant-Value Imputation' },
      { value: 'knn_imputation',             label: 'KNN Imputation' },
      { value: 'mice_imputation',            label: 'MICE Imputation' },
      { value: 'forward_fill',               label: 'Forward Fill' },
      { value: 'backward_fill',              label: 'Backward Fill' },
      { value: 'interpolation',              label: 'Linear Interpolation' },
      { value: 'rolling_average_imputation', label: 'Rolling-Average Imputation' },
      { value: 'missing_indicator',          label: 'Missing-Indicator Variables' },
      { value: 'listwise_deletion',          label: 'Listwise Deletion' },
      { value: 'delete_rows_with_missing',   label: 'Row Deletion (Missing)' },
      { value: 'delete_column',              label: 'Column Deletion' },
    ],
  },
  {
    label: 'C. Duplicate Data',
    color: '#D4A373',
    options: [
      { value: 'duplicate_removal',          label: 'Exact Duplicate Removal' },
      { value: 'keep_first_occurrence',      label: 'Keep First Occurrence' },
      { value: 'keep_last_occurrence',       label: 'Keep Last Occurrence' },
      { value: 'fuzzy_deduplication',        label: 'Fuzzy Duplicate Detection' },
    ],
  },
  {
    label: 'D. Data-Type Cleaning',
    color: '#7C9082',
    options: [
      { value: 'auto_type_cast',             label: 'Auto Type Cast' },
      { value: 'boolean_conversion',         label: 'Boolean Conversion' },
      { value: 'datetime_conversion',        label: 'DateTime Conversion' },
      { value: 'category_conversion',        label: 'Category Conversion' },
      { value: 'delete_column',             label: 'Delete Column' },
    ],
  },
  {
    label: 'E. Numerical Data Cleaning',
    color: '#7A8B99',
    options: [
      { value: 'clip_values',                label: 'Value Clipping / Capping' },
      { value: 'round_values',               label: 'Rounding' },
      { value: 'decimal_correction',         label: 'Decimal / Precision Correction' },
      { value: 'remove_negative_values',     label: 'Remove Negative Values' },
      { value: 'remove_zero_values',         label: 'Remove Zero Values' },
      { value: 'numeric_string_conversion',  label: 'Numeric-String Conversion' },
    ],
  },
  {
    label: 'F. Outlier Detection & Removal',
    color: '#C88272',
    options: [
      { value: 'iqr_outlier_removal',        label: 'IQR Method' },
      { value: 'zscore_outlier_removal',     label: 'Z-Score' },
      { value: 'modified_zscore_removal',    label: 'Modified Z-Score' },
      { value: 'mad_outlier_removal',        label: 'MAD (Median Absolute Deviation)' },
      { value: 'winsorization',              label: 'Winsorization' },
      { value: 'percentile_capping',         label: 'Percentile / Quantile Capping' },
      { value: 'isolation_forest',           label: 'Isolation Forest' },
      { value: 'lof_outlier_removal',        label: 'Local Outlier Factor (LOF)' },
    ],
  },
  {
    label: 'G. Categorical Data Cleaning',
    color: '#D4A373',
    options: [
      { value: 'standardize_text',           label: 'Category Standardization' },
      { value: 'standardize_gender',         label: 'Gender Standardization' },
      { value: 'merge_rare_categories',      label: 'Rare-Category Grouping' },
      { value: 'map_categories',             label: 'Category Mapping' },
      { value: 'unknown_category_fill',      label: 'Unknown-Category Handling' },
      { value: 'lowercase_conversion',       label: 'Case Normalization (Lower)' },
      { value: 'uppercase_conversion',       label: 'Case Normalization (Upper)' },
    ],
  },
  {
    label: 'H. Text Cleaning',
    color: '#7C9082',
    options: [
      { value: 'strip_whitespace',           label: 'Whitespace Removal (Strip)' },
      { value: 'remove_extra_spaces',        label: 'Extra-Space Removal' },
      { value: 'lowercase_conversion',       label: 'Lowercase Conversion' },
      { value: 'uppercase_conversion',       label: 'Uppercase Conversion' },
      { value: 'remove_punctuation',         label: 'Punctuation Removal' },
      { value: 'remove_special_characters',  label: 'Special-Character Removal' },
      { value: 'remove_html_tags',           label: 'HTML-Tag Removal' },
      { value: 'remove_urls',                label: 'URL Removal' },
      { value: 'remove_emails',              label: 'Email Removal' },
      { value: 'unicode_normalize',          label: 'Unicode Normalization' },
      { value: 'fix_encoding',               label: 'Encoding Correction' },
    ],
  },
  {
    label: 'I. Date & Time Cleaning',
    color: '#7A8B99',
    options: [
      { value: 'parse_dates',                label: 'Date Parsing' },
      { value: 'standardize_date_format',    label: 'Date-Format Standardization' },
      { value: 'datetime_conversion',        label: 'DateTime Conversion' },
      { value: 'extract_year',               label: 'Year Extraction' },
      { value: 'extract_month',              label: 'Month Extraction' },
      { value: 'extract_day',                label: 'Day Extraction' },
      { value: 'extract_day_of_week',        label: 'Day-of-Week Extraction' },
      { value: 'future_date_detection',      label: 'Future-Date Detection' },
      { value: 'date_component_extraction',  label: 'Date-Component Extraction' },
    ],
  },
  {
    label: 'J. Unit & Measurement Cleaning',
    color: '#C88272',
    options: [
      { value: 'unit_standardization',       label: 'Unit Standardization' },
      { value: 'unit_conversion',            label: 'Unit Conversion' },
      { value: 'measurement_validation',     label: 'Measurement Validation' },
    ],
  },
  {
    label: 'K. Data Validation',
    color: '#D4A373',
    options: [
      { value: 'range_validation',           label: 'Range Validation' },
      { value: 'impossible_value_detection', label: 'Impossible-Value Detection' },
      { value: 'zero_value_validation',      label: 'Zero-Value Validation' },
      { value: 'uniqueness_validation',      label: 'Uniqueness Validation' },
      { value: 'completeness_validation',    label: 'Completeness Validation' },
    ],
  },
  {
    label: 'L. Inconsistent Data',
    color: '#7C9082',
    options: [
      { value: 'standardize_text',           label: 'Case / Spelling Inconsistency Fix' },
      { value: 'unicode_normalize',          label: 'Format Inconsistency Correction' },
      { value: 'map_categories',             label: 'Naming Inconsistency Correction' },
    ],
  },
  {
    label: 'M. Address & Contact Cleaning',
    color: '#7A8B99',
    options: [
      { value: 'email_removal_or_masking',   label: 'Email Normalization / Masking' },
      { value: 'remove_emails',              label: 'Email Removal' },
      { value: 'mask_data',                  label: 'Phone-Number Masking' },
    ],
  },
  {
    label: 'N. Database / Data Integration',
    color: '#C88272',
    options: [
      { value: 'standardize_text',           label: 'Column-Name Standardization' },
      { value: 'duplicate_removal',          label: 'Orphan-Record Removal' },
    ],
  },
  {
    label: 'O. Data Transformation',
    color: '#D4A373',
    options: [
      { value: 'minmax_scaling',             label: 'Min-Max Normalization' },
      { value: 'standard_scaling',           label: 'Z-Score Standardization' },
      { value: 'robust_scaling',             label: 'Robust Scaling' },
      { value: 'max_abs_scaling',            label: 'Max-Abs Scaling' },
      { value: 'log_transformation',         label: 'Log Transformation' },
      { value: 'sqrt_transformation',        label: 'Square-Root Transformation' },
      { value: 'power_transformation',       label: 'Box-Cox / Yeo-Johnson' },
      { value: 'quantile_transformation',    label: 'Quantile Transformation' },
      { value: 'binning',                    label: 'Binning / Discretization' },
      { value: 'discretize',                 label: 'Quantile Binning (qcut)' },
    ],
  },
  {
    label: 'P. Handling Skewness',
    color: '#7C9082',
    options: [
      { value: 'log_transformation',         label: 'Log Transformation' },
      { value: 'sqrt_transformation',        label: 'Square-Root Transformation' },
      { value: 'power_transformation',       label: 'Box-Cox / Yeo-Johnson Transformation' },
      { value: 'quantile_transformation',    label: 'Quantile Transformation' },
      { value: 'winsorization',              label: 'Winsorization (skew control)' },
    ],
  },
  {
    label: 'Q. Imbalanced Data',
    color: '#7A8B99',
    options: [
      { value: 'smote',                      label: 'SMOTE Oversampling' },
      { value: 'random_oversample',          label: 'Random Oversampling' },
      { value: 'random_undersample',         label: 'Random Undersampling' },
    ],
  },
  {
    label: 'R. Noise Removal',
    color: '#C88272',
    options: [
      { value: 'moving_average_smooth',      label: 'Moving-Average Smoothing' },
      { value: 'rolling_median_smooth',      label: 'Rolling-Median Smoothing' },
      { value: 'binning',                    label: 'Binning / Smoothing' },
    ],
  },
  {
    label: 'S. Feature Cleaning',
    color: '#D4A373',
    options: [
      { value: 'delete_column',              label: 'Irrelevant / Constant Feature Removal' },
      { value: 'near_zero_variance_removal', label: 'Near-Zero Variance Removal' },
      { value: 'correlated_feature_removal', label: 'Highly Correlated Feature Removal' },
      { value: 'robust_scaling',             label: 'Feature Scaling' },
      { value: 'quantile_transformation',    label: 'Feature Transformation' },
    ],
  },
  {
    label: 'T. Encoding Categorical Variables',
    color: '#7C9082',
    options: [
      { value: 'label_encoding',             label: 'Label Encoding' },
      { value: 'ordinal_encoding',           label: 'Ordinal Encoding' },
      { value: 'one_hot_encoding',           label: 'One-Hot Encoding' },
      { value: 'binary_encoding',            label: 'Binary Encoding' },
      { value: 'frequency_encoding',         label: 'Frequency / Count Encoding' },
      { value: 'target_encoding',            label: 'Target Encoding' },
    ],
  },
  {
    label: 'U. Data Leakage Prevention',
    color: '#7A8B99',
    options: [
      { value: 'delete_column',              label: 'Target Leakage — Delete Feature' },
      { value: 'near_zero_variance_removal', label: 'Duplicate Leakage Removal' },
    ],
  },
  {
    label: 'V. Privacy & Data Sanitization',
    color: '#C88272',
    options: [
      { value: 'mask_data',                  label: 'Data Masking' },
      { value: 'pseudonymize',               label: 'Pseudonymization (Hash)' },
      { value: 'remove_pii',                 label: 'PII Column Removal' },
      { value: 'remove_emails',              label: 'Identifier / Email Removal' },
    ],
  },
  {
    label: 'W. Time-Series Data Cleaning',
    color: '#D4A373',
    options: [
      { value: 'remove_duplicate_timestamps', label: 'Duplicate Timestamp Removal' },
      { value: 'forward_fill',               label: 'Forward Fill (Time-series)' },
      { value: 'backward_fill',              label: 'Backward Fill (Time-series)' },
      { value: 'interpolation',              label: 'Time-Series Interpolation' },
      { value: 'moving_average_smooth',      label: 'Moving Averages' },
      { value: 'rolling_median_smooth',      label: 'Rolling Statistics' },
    ],
  },
  {
    label: 'X. Image / Data-Specific',
    color: '#7C9082',
    options: [
      { value: 'duplicate_removal',          label: 'Duplicate Record Detection' },
      { value: 'data_profiling',             label: 'Corrupted Record Detection' },
      { value: 'label_encoding',             label: 'Label Correction' },
    ],
  },
  {
    label: 'Y. Data Quality Monitoring',
    color: '#7A8B99',
    options: [
      { value: 'data_quality_scoring',       label: 'Data-Quality Score' },
      { value: 'data_profiling',             label: 'Data Drift Detection' },
      { value: 'data_auditing',              label: 'Audit Trail / Cleaning Log' },
      { value: 'data_quality_assessment',    label: 'Automated Data-Quality Report' },
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
      .map(g => ({
        ...g,
        options: g.options.filter(o =>
          o.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q)
        ),
      }))
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
        <span className="truncate text-gray-700">{selected?.label || 'Select technique…'}</span>
        <span className="text-gray-400 text-xs flex-shrink-0">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden" style={{ minWidth: 320 }}>
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-white sticky top-0">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search all techniques (A–Y)…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 text-sm outline-none text-gray-700 bg-transparent"
              onClick={e => e.stopPropagation()}
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            )}
          </div>

          {/* Count badge */}
          <div className="px-3 py-1 bg-gray-50 text-[10px] text-gray-400 font-semibold border-b border-gray-100">
            {filtered.reduce((s, g) => s + g.options.length, 0)} techniques
            {query && ` matching "${query}"`}
          </div>

          {/* Grouped options */}
          <div className="max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">No techniques found for "{query}"</div>
            ) : (
              filtered.map(group => (
                <div key={group.label}>
                  <div
                    className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider sticky top-0"
                    style={{ background: group.color + '18', color: group.color }}
                  >
                    {group.label}
                  </div>
                  {group.options.map(opt => (
                    <button
                      key={opt.value + opt.label}
                      type="button"
                      onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                      className={`w-full text-left px-5 py-2 text-sm hover:bg-gray-50 transition-colors ${
                        value === opt.value ? 'font-bold bg-[#F2F5F3] text-[#7C9082]' : 'text-gray-700'
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

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CleaningDashboard() {
  const { currentDataset, analysisResult, recommendations, setRecommendations, setDataset } = useAppStore();
  const cols = analysisResult?.columns?.map(c => c.column_name) || [];

  const [pipeline, setPipeline]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [fetchingRecs, setFetchingRecs] = useState(false);
  const [showAdd, setShowAdd]           = useState(false);
  const [newOp, setNewOp]               = useState({ column: cols[0] || '', technique: ALL_OPTIONS[0].value });

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

  const removeOperation = id => setPipeline(prev => prev.filter(p => p.id !== id));

  const addAllAiSuggestions = () => {
    if (!recommendations?.length) return toast.error('No AI suggestions available');
    const items = recommendations.map(rec => ({
      column: rec.column,
      technique: (rec.technique || 'mean_imputation').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_'),
      id: Date.now() + Math.random(),
    }));
    setPipeline(prev => [...prev, ...items]);
    toast.success(`Added ${items.length} AI suggestions to pipeline`);
  };

  const runPipeline = async () => {
    if (!currentDataset?.id) return toast.error('No dataset loaded');
    if (!pipeline.length) return toast.error('Pipeline is empty');
    setLoading(true);
    const ops = pipeline.map(p => ({ column: p.column, operation: p.technique, params: {} }));
    try {
      const res = await cleanDataset(currentDataset.id, { operations: ops });
      setDataset({
        ...currentDataset,
        rows: res.data.cleaned_rows ?? currentDataset.rows,
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

  const totalTechniques = OPERATION_GROUPS.reduce((s, g) => s + g.options.length, 0);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">Data Cleaning Pipeline</h2>
          <p className="text-gray-500 font-medium">
            {totalTechniques} techniques across 25 categories (A–Y) — build and execute sequentially.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {recommendations?.length > 0 && (
            <button onClick={addAllAiSuggestions} className="btn-nd btn-nd-secondary text-[#7C9082]">
              <Sparkles size={14} /> Add All AI Suggestions
            </button>
          )}
          <button onClick={() => setPipeline([])} disabled={!pipeline.length} className="btn-nd btn-nd-secondary text-[#C88272]">
            <Trash2 size={14} /> Clear All
          </button>
          <button onClick={runPipeline} disabled={loading || !pipeline.length} className="btn-nd btn-nd-primary shadow-soft">
            {loading ? <Activity size={16} className="animate-spin" /> : <PlayCircle size={16} />}
            {loading ? 'Running…' : 'Run Pipeline'}
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
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-400 shadow-sm flex-shrink-0">{i + 1}</div>
                    <div className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200 truncate max-w-[120px]">{p.column}</div>
                    <div className="text-gray-400 font-bold flex-shrink-0">→</div>
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
                  No operations scheduled. Add from the {totalTechniques}+ techniques below or pick from AI Suggestions.
                </div>
              )}

              {showAdd ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex-wrap items-start">
                  {/* Column selector */}
                  <select
                    className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium min-w-[140px]"
                    value={newOp.column}
                    onChange={e => setNewOp({ ...newOp, column: e.target.value })}
                  >
                    {cols.length
                      ? cols.map(c => <option key={c} value={c}>{c}</option>)
                      : <option value="">No columns loaded</option>}
                  </select>

                  {/* Searchable technique picker */}
                  <TechniquePicker value={newOp.technique} onChange={val => setNewOp({ ...newOp, technique: val })} />

                  <div className="flex gap-2">
                    <button onClick={() => addOperation(newOp.column, newOp.technique)} className="btn-nd btn-nd-sage px-5">
                      <Plus size={16} /> Add
                    </button>
                    <button onClick={() => setShowAdd(false)} className="btn-nd btn-nd-secondary px-4">
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button onClick={() => setShowAdd(true)}
                  className="flex items-center justify-center gap-2 w-full mt-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-800 transition-colors">
                  <Plus size={16} /> Add Custom Operation ({totalTechniques}+ techniques available)
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
                  <Activity size={16} className="animate-spin text-[#7C9082]" /> Fetching…
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
                        <button onClick={() => addOperation(col, tech)} disabled={inPipeline}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 flex-shrink-0 ${
                            inPipeline ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#7C9082] text-white shadow-sm'
                          }`}>
                          {inPipeline ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                          {inPipeline ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs font-medium">
                  {currentDataset ? 'Run Quality Scan to get AI recommendations' : 'Upload a dataset first'}
                </div>
              )}
            </div>
          </NordicCard>

          <NordicCard title="Pipeline Guidelines" icon={AlertTriangle} color="terra">
            <div className="text-xs text-gray-600 font-medium space-y-3 mt-1 leading-relaxed">
              <p>• Operations execute top-to-bottom sequentially.</p>
              <p>• Use the search box to find any of the {totalTechniques}+ techniques across all A–Y categories.</p>
              <p>• Impute missing values before removing outliers for best results.</p>
              <p>• Privacy operations (V) are irreversible — use carefully.</p>
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
