/**
 * Nordic Light Cleaning Dashboard
 * Features:
 *  - Sequential pipeline builder
 *  - AI Suggestions section with 1-click "Add to Pipeline" & "Add All AI Suggestions"
 *  - Fixed backend payload mapping (operation vs technique)
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Zap, AlertTriangle, X, PlayCircle, Activity, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import { cleanDataset, getRecommendations } from '../api/client';
import toast from 'react-hot-toast';

const OPERATION_OPTIONS = [
  { value: 'mean_imputation',        label: 'Mean Imputation' },
  { value: 'median_imputation',      label: 'Median Imputation' },
  { value: 'mode_imputation',        label: 'Mode Imputation' },
  { value: 'knn_imputation',         label: 'KNN Imputation' },
  { value: 'mice_imputation',        label: 'MICE Imputation' },
  { value: 'zscore_outlier_removal', label: 'Z-Score Outlier Removal' },
  { value: 'iqr_outlier_removal',    label: 'IQR Outlier Removal' },
  { value: 'winsorization',          label: 'Winsorization' },
  { value: 'one_hot_encoding',       label: 'One-Hot Encoding' },
  { value: 'log_transformation',     label: 'Log Transformation' },
  { value: 'delete_column',          label: 'Delete Column' },
  { value: 'delete_rows_with_missing', label: 'Delete Rows with Missing' },
  { value: 'duplicate_removal',      label: 'Duplicate Removal' },
];

export default function CleaningDashboard() {
  const { currentDataset, analysisResult, recommendations, setRecommendations, setDataset } = useAppStore();
  const cols = analysisResult?.columns?.map(c => c.column_name) || [];

  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetchingRecs, setFetchingRecs] = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [newOp, setNewOp]       = useState({ column: cols[0] || '', technique: OPERATION_OPTIONS[0].value });

  // Fetch AI Recommendations if not already in store
  useEffect(() => {
    if (currentDataset?.id && (!recommendations || recommendations.length === 0)) {
      setFetchingRecs(true);
      getRecommendations(currentDataset.id)
        .then(res => {
          if (Array.isArray(res.data)) {
            setRecommendations(res.data);
          }
        })
        .catch(() => {
          // silent fallback
        })
        .finally(() => setFetchingRecs(false));
    }
  }, [currentDataset?.id]);

  useEffect(() => {
    if (cols.length > 0 && !newOp.column) {
      setNewOp(prev => ({ ...prev, column: cols[0] }));
    }
  }, [cols]);

  const addOperation = (column, technique) => {
    setPipeline(prev => [...prev, { column, technique, id: Date.now() + Math.random() }]);
    setShowAdd(false);
    toast.success(`Added ${technique} for ${column}`);
  };

  const removeOperation = (id) => {
    setPipeline(prev => prev.filter(p => p.id !== id));
  };

  const addAllAiSuggestions = () => {
    if (!recommendations || recommendations.length === 0) {
      return toast.error('No AI suggestions available');
    }
    const newItems = recommendations.map(rec => ({
      column: rec.column,
      technique: (rec.technique || rec.recommendation || 'mean_imputation').toLowerCase().replace(/ /g, '_'),
      id: Date.now() + Math.random(),
    }));
    setPipeline(prev => [...prev, ...newItems]);
    toast.success(`Added ${newItems.length} AI suggestions to pipeline`);
  };

  const runPipeline = async () => {
    if (!currentDataset?.id) return toast.error('No dataset loaded');
    if (!pipeline.length) return toast.error('Pipeline is empty');

    setLoading(true);
    // Format payload properly for backend CleaningOperation schema: { column, operation, params }
    const operationsPayload = pipeline.map(p => ({
      column: p.column,
      operation: p.technique,
      params: {},
    }));

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
      toast.success(res.data.message || 'Data cleaning pipeline executed successfully!');
      setPipeline([]);
    } catch (err) {
      console.error('Cleaning error:', err);
      toast.error(err?.message || 'Pipeline execution failed. Please check operation parameters.');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (val) => {
    const opt = OPERATION_OPTIONS.find(o => o.value === val || o.label === val);
    return opt ? opt.label : val;
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Data Cleaning Pipeline</h2>
          <p className="text-gray-500 font-medium">Build, review, and execute sequential mutation operations.</p>
        </div>
        <div className="flex gap-3">
          {recommendations && recommendations.length > 0 && (
            <button onClick={addAllAiSuggestions} className="btn-nd btn-nd-secondary text-[#7C9082] hover:text-[#7C9082]">
              <Sparkles size={14} /> Add All AI Suggestions
            </button>
          )}
          <button onClick={() => setPipeline([])} disabled={!pipeline.length} className="btn-nd btn-nd-secondary text-[#C88272] hover:text-[#C88272]">
            <Trash2 size={14} /> Clear All
          </button>
          <button onClick={runPipeline} disabled={loading || !pipeline.length} className="btn-nd btn-nd-primary shadow-soft">
            {loading ? <Activity size={16} className="animate-spin" /> : <PlayCircle size={16} />} Run Pipeline
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Sequence Builder */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Operation Sequence Card */}
          <NordicCard title="Operation Sequence" icon={Zap} color="sage">
            <div className="flex flex-col gap-3 min-h-[220px] mt-2">
              <AnimatePresence>
                {pipeline.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm font-bold text-gray-400 shadow-sm">
                      {i + 1}
                    </div>
                    <div className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-gray-700 border border-gray-200">
                      {p.column}
                    </div>
                    <div className="text-gray-400 font-bold">→</div>
                    <div className="px-3 py-1 bg-white rounded-full text-sm font-semibold text-[#7C9082] border border-gray-200">
                      {getLabel(p.technique)}
                    </div>
                    <button
                      onClick={() => removeOperation(p.id)}
                      className="ml-auto w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-[#C88272] hover:bg-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {pipeline.length === 0 && !showAdd && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-medium text-sm p-8 border-2 border-dashed border-gray-200 rounded-3xl">
                  No operations scheduled. Add custom steps or pick from AI Suggestions below.
                </div>
              )}

              {showAdd ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex-wrap sm:flex-nowrap">
                  <select
                    className="flex-1 min-w-[140px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium"
                    value={newOp.column}
                    onChange={e => setNewOp({ ...newOp, column: e.target.value })}
                  >
                    {cols.length ? cols.map(c => <option key={c} value={c}>{c}</option>) : <option value="">No columns</option>}
                  </select>

                  <select
                    className="flex-1 min-w-[180px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium"
                    value={newOp.technique}
                    onChange={e => setNewOp({ ...newOp, technique: e.target.value })}
                  >
                    {OPERATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>

                  <button onClick={() => addOperation(newOp.column, newOp.technique)} className="btn-nd btn-nd-sage px-5">
                    <Plus size={16} /> Add
                  </button>
                  <button onClick={() => setShowAdd(false)} className="btn-nd btn-nd-secondary px-4">
                    <X size={16} />
                  </button>
                </motion.div>
              ) : (
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center justify-center gap-2 w-full mt-2 py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-800 transition-colors"
                >
                  <Plus size={16} /> Add Custom Operation
                </button>
              )}
            </div>
          </NordicCard>
        </div>

        {/* Right Column: AI Suggestions & Guidelines */}
        <div className="flex flex-col gap-6">
          {/* AI Suggestions Card */}
          <NordicCard title="AI Recommended Suggestions" icon={Sparkles} color="mustard">
            <div className="flex flex-col gap-3 mt-2">
              {fetchingRecs ? (
                <div className="flex items-center justify-center py-6 text-gray-400 text-sm gap-2">
                  <Activity size={16} className="animate-spin text-[#7C9082]" /> Fetching recommendations...
                </div>
              ) : recommendations && recommendations.length > 0 ? (
                recommendations.slice(0, 5).map((rec, idx) => {
                  const tech = rec.technique || rec.recommendation || 'mean_imputation';
                  const col = rec.column;
                  const alreadyInPipeline = pipeline.some(p => p.column === col && p.technique === tech.toLowerCase().replace(/ /g, '_'));

                  return (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800 text-sm">{col}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-[#F2F5F3] text-[#7C9082] rounded-full">
                          {rec.confidence ? `${rec.confidence}% match` : 'AI Match'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{rec.reason || rec.problem || 'Recommended clean technique'}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-[#7A8B99]">{getLabel(tech.toLowerCase().replace(/ /g, '_'))}</span>
                        <button
                          onClick={() => addOperation(col, tech.toLowerCase().replace(/ /g, '_'))}
                          disabled={alreadyInPipeline}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                            alreadyInPipeline
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-[#7C9082] text-white hover:bg-opacity-90 shadow-sm'
                          }`}
                        >
                          {alreadyInPipeline ? <CheckCircle2 size={12} /> : <Plus size={12} />}
                          {alreadyInPipeline ? 'Added' : 'Add to Pipeline'}
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

          {/* Instructions Card */}
          <NordicCard title="Pipeline Execution Guidelines" icon={AlertTriangle} color="terra">
            <div className="text-xs text-gray-600 font-medium space-y-3 mt-1 leading-relaxed">
              <p>• Operations are executed in top-to-bottom sequence.</p>
              <p>• Perform missing value imputations before removing outliers for best results.</p>
              <div className="p-3 bg-[#F8F2F0] rounded-xl text-[#C88272] border border-[#C88272] border-opacity-20 font-semibold">
                Execution updates dataset memory state immediately.
              </div>
            </div>
          </NordicCard>
        </div>
      </div>
    </div>
  );
}
