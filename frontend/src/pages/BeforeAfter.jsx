/**
 * Before & After Diff Dashboard — Nordic Light
 * Side-by-side comparison of original vs cleaned dataset,
 * precise delta metrics, quality score improvements, and cell-level diff highlighting.
 */
import { motion } from 'framer-motion';
import {
  SplitSquareHorizontal, TrendingUp, TrendingDown, Trash2, Sparkles,
  AlertTriangle, GitCompare, Download, ArrowRight, CheckCircle2, FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NordicCard from '../components/ui/NordicCard';
import CleaningProgressBar from '../components/ui/CleaningProgressBar';
import useAppStore from '../store/useAppStore';

// Highlight cells that changed between original and cleaned
function cellChanged(orig, clean, key) {
  const a = orig?.[key], b = clean?.[key];
  if ((a === null || a === undefined || a === '') && b !== null && b !== undefined && b !== '') return 'filled';
  if (a !== null && a !== undefined && b !== null && b !== undefined && String(a) !== String(b)) return 'changed';
  return null;
}

function DataTable({ rows, originalRows, label, isOriginal }) {
  if (!rows?.length) return (
    <div className="text-center py-10 text-gray-400 font-medium text-sm">No data available</div>
  );
  const headers = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto max-h-[420px]">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{label}</div>
      <table className="w-full whitespace-nowrap text-xs border-collapse">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-gray-100">
            {headers.map(h => (
              <th key={h} className="text-left py-2.5 px-3 font-bold text-gray-500 bg-gray-50/80 rounded-lg">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
              {headers.map(h => {
                const change = !isOriginal ? cellChanged(originalRows?.[i], row, h) : null;
                return (
                  <td
                    key={h}
                    className={`py-2 px-3 transition-colors ${
                      change === 'filled'
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : change === 'changed'
                        ? 'bg-amber-50 text-amber-800 font-bold'
                        : 'text-gray-700'
                    }`}
                  >
                    {row[h] === null || row[h] === undefined
                      ? <span className="px-1.5 py-0.5 bg-[#F8F2F0] text-[#C88272] rounded text-[10px] font-bold">NULL</span>
                      : String(row[h])
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BeforeAfter() {
  const navigate = useNavigate();
  const { currentDataset } = useAppStore();

  const originalRows = currentDataset?.preview ?? null;
  const cleanedRows = currentDataset?.cleanedPreview ?? currentDataset?.preview ?? null;
  const delta = currentDataset?.delta ?? null;
  const hasBeenCleaned = !!currentDataset?.cleanedPreview || !!currentDataset?.isCleaned || currentDataset?.status === 'cleaned';

  // Quality difference calculation with safe float precision
  const qualityBefore = delta?.quality_before != null ? Number(Number(delta.quality_before).toFixed(1)) : null;
  const qualityAfter = delta?.quality_after != null ? Number(Number(delta.quality_after).toFixed(1)) : null;
  const qualityDiff = qualityBefore != null && qualityAfter != null ? Number((qualityAfter - qualityBefore).toFixed(1)) : null;

  // ── Empty state: no dataset ──────────────────────────────────────────
  if (!currentDataset) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Before &amp; After</h2>
          <p className="text-gray-500 font-medium">Compare original vs cleaned dataset side by side.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center bg-white rounded-3xl shadow-soft border border-gray-100">
          <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
            <GitCompare size={36} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No dataset loaded</h3>
            <p className="text-gray-400 font-medium text-sm max-w-sm">
              Upload a dataset and run the cleaning pipeline to see a before/after comparison.
            </p>
          </div>
          <button onClick={() => navigate('/upload')} className="btn-nd btn-nd-sage">
            Upload Dataset
          </button>
        </div>
      </div>
    );
  }

  // ── Empty state: dataset loaded but not yet cleaned ──────────────────
  if (!hasBeenCleaned) {
    return (
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Before &amp; After</h2>
          <p className="text-gray-500 font-medium">Compare original vs cleaned dataset side by side.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center bg-white rounded-3xl shadow-soft border border-gray-100">
          <div className="w-20 h-20 rounded-3xl bg-[#F2F5F3] flex items-center justify-center text-[#7C9082]">
            <GitCompare size={36} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No cleaning done yet</h3>
            <p className="text-gray-400 font-medium text-sm max-w-sm">
              Run the cleaning pipeline on <strong>{currentDataset.name}</strong> to generate a comparison. You can apply AI recommendations or build a custom pipeline.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/recommendations')} className="btn-nd btn-nd-sage">
              Apply AI Recommendations
            </button>
            <button onClick={() => navigate('/clean')} className="btn-nd btn-nd-secondary">
              Manual Cleaning
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Full comparison view ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Before &amp; After</h2>
          <p className="text-gray-500 font-medium">Comparing original vs cleaned: {currentDataset.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/download')}
            className="btn-nd btn-nd-sage flex items-center gap-2 text-xs font-bold shadow-soft"
          >
            <Download size={14} /> Export Cleaned CSV
          </button>
          <button
            onClick={() => navigate('/visualizations')}
            className="btn-nd btn-nd-secondary flex items-center gap-2 text-xs font-bold"
          >
            <FileSpreadsheet size={14} /> Visualizations
          </button>
        </div>
      </div>

      {/* Visual Cleaning Success & Cleanliness Progress Bar */}
      <CleaningProgressBar
        progress={100}
        status="completed"
        currentStep="Dataset cleaning and quality validation 100% complete"
        totalSteps={1}
        completedSteps={1}
        delta={delta}
        appliedCount={1}
        showActions={false}
      />

      {/* Delta Summary Cards */}
      {delta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Rows Removed',
              value: (delta.rows_removed ?? 0).toLocaleString(),
              icon: Trash2,
              bg: '#F8F2F0',
              tc: '#C88272'
            },
            {
              label: 'Nulls Filled',
              value: (delta.nulls_filled ?? 0).toLocaleString(),
              icon: Sparkles,
              bg: '#F2F5F3',
              tc: '#7C9082'
            },
            {
              label: 'Outliers Capped',
              value: (delta.outliers_capped ?? 0).toLocaleString(),
              icon: AlertTriangle,
              bg: '#F9F6F2',
              tc: '#D4A373'
            },
            {
              label: 'Quality Score Delta',
              value: qualityDiff !== null
                ? (qualityDiff > 0 ? `+${qualityDiff}%` : `${qualityDiff}%`)
                : '0.0%',
              icon: qualityDiff && qualityDiff < 0 ? TrendingDown : TrendingUp,
              bg: qualityDiff && qualityDiff < 0 ? '#F9F6F2' : '#F2F5F3',
              tc: qualityDiff && qualityDiff < 0 ? '#D4A373' : '#7C9082'
            },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <s.icon size={18} style={{ color: s.tc }} />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-gray-900 tracking-tight">{s.value}</div>
                <div className="text-xs font-semibold text-gray-400 mt-0.5">{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Quality score bars */}
      {qualityBefore !== null && qualityAfter !== null && (
        <NordicCard title="Quality Score Improvement" icon={TrendingUp} color="sage">
          <div className="grid grid-cols-2 gap-8 mt-4">
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                <span>Before Cleaning</span>
                <span className="text-[#C88272] font-bold">{qualityBefore}%</span>
              </div>
              <div className="progress-bg">
                <motion.div
                  className="progress-fill"
                  style={{ background: '#C88272' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${qualityBefore}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                <span>After Cleaning</span>
                <span className="text-[#7C9082] font-bold">{qualityAfter}%</span>
              </div>
              <div className="progress-bg">
                <motion.div
                  className="progress-fill"
                  style={{ background: '#7C9082' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${qualityAfter}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            {qualityDiff !== null && qualityDiff > 0 ? (
              <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 border border-emerald-200">
                <TrendingUp size={14} /> ↑ +{qualityDiff}% Quality Improvement
              </span>
            ) : qualityDiff !== null && qualityDiff < 0 ? (
              <span className="px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 border border-amber-200">
                <TrendingDown size={14} /> {qualityDiff}% Quality Score Variation
              </span>
            ) : (
              <span className="px-4 py-1.5 bg-gray-50 text-gray-700 rounded-full text-xs font-extrabold inline-flex items-center gap-1.5 border border-gray-200">
                <CheckCircle2 size={14} /> Quality Maintained at {qualityAfter}%
              </span>
            )}
          </div>
        </NordicCard>
      )}

      {/* Side-by-side tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NordicCard title="Original Dataset Preview" subtitle="First 10 rows (unmodified)" icon={SplitSquareHorizontal} color="mustard">
          <DataTable rows={originalRows} isOriginal={true} label="ORIGINAL" />
        </NordicCard>

        <NordicCard title="Cleaned Dataset Preview" subtitle="Emerald = nulls filled · Amber = values capped/standardized" icon={SplitSquareHorizontal} color="sage">
          <DataTable rows={cleanedRows} originalRows={originalRows} isOriginal={false} label="CLEANED" />
        </NordicCard>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs font-semibold text-gray-500 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-500" />
          Null value was filled (imputation)
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-500" />
          Value was capped / standardized
        </div>
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 bg-[#F8F2F0] text-[#C88272] rounded text-[10px] font-bold">NULL</span>
          Original Missing Value
        </div>
      </div>
    </div>
  );
}
