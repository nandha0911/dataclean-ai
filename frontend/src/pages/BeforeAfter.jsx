/**
 * BeforeAfter — Nordic Light
 * Shows side-by-side tables of original vs cleaned dataset.
 * Shows a clean empty state when cleaning hasn't been run yet.
 */
import { motion } from 'framer-motion';
import { SplitSquareHorizontal, TrendingUp, Trash2, Sparkles, AlertTriangle, GitCompare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';

// Highlight cells that changed between original and cleaned
function cellChanged(orig, clean, key) {
  const a = orig?.[key], b = clean?.[key];
  if (a === null && b !== null) return 'filled';   // was null, now filled
  if (a !== null && a !== b)   return 'changed';   // value changed (outlier capped etc.)
  return null;
}

function DataTable({ rows, originalRows, label, isOriginal }) {
  if (!rows?.length) return (
    <div className="text-center py-10 text-gray-400 font-medium text-sm">No data available</div>
  );
  const headers = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{label}</div>
      <table className="w-full whitespace-nowrap text-sm">
        <thead>
          <tr>
            {headers.map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {headers.map(h => {
                const change = !isOriginal ? cellChanged(originalRows?.[i], row, h) : null;
                return (
                  <td key={h}
                    className={
                      change === 'filled'  ? 'bg-green-50 text-[#7C9082] font-semibold' :
                      change === 'changed' ? 'bg-amber-50 text-[#D4A373] font-semibold' :
                      ''
                    }
                  >
                    {row[h] === null
                      ? <span className="px-2 py-0.5 bg-[#F8F2F0] text-[#C88272] rounded-md text-xs font-bold">NULL</span>
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

  const originalRows = currentDataset?.preview       ?? null;
  const cleanedRows  = currentDataset?.cleanedPreview ?? currentDataset?.preview ?? null;
  const delta        = currentDataset?.delta          ?? null;
  const hasBeenCleaned = !!currentDataset?.cleanedPreview || !!currentDataset?.isCleaned || currentDataset?.status === 'cleaned';

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
          <button onClick={() => navigate('/upload')} className="btn-nd btn-nd-primary">
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
      </div>

      {/* Delta Summary Cards */}
      {delta && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Rows Removed',    value: delta.rows_removed    ?? 0, icon: Trash2,        bg: '#F8F2F0', tc: '#C88272' },
            { label: 'Nulls Filled',    value: delta.nulls_filled    ?? 0, icon: Sparkles,      bg: '#F2F5F3', tc: '#7C9082' },
            { label: 'Outliers Capped', value: delta.outliers_capped ?? 0, icon: AlertTriangle, bg: '#F9F6F2', tc: '#D4A373' },
            { label: 'Quality Gained',  value: delta.quality_after && delta.quality_before
                ? `+${delta.quality_after - delta.quality_before}%` : 'N/A',
              icon: TrendingUp, bg: '#F2F5F3', tc: '#7C9082' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-soft flex items-center gap-4">
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
      {delta?.quality_before != null && delta?.quality_after != null && (
        <NordicCard title="Quality Score Improvement" icon={TrendingUp} color="sage">
          <div className="grid grid-cols-2 gap-8 mt-4">
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                <span>Before Cleaning</span>
                <span className="text-[#C88272]">{delta.quality_before}%</span>
              </div>
              <div className="progress-bg">
                <motion.div className="progress-fill" style={{ background: '#C88272' }}
                  initial={{ width: 0 }} animate={{ width: `${delta.quality_before}%` }} transition={{ duration: 1 }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold text-gray-600 mb-2">
                <span>After Cleaning</span>
                <span className="text-[#7C9082]">{delta.quality_after}%</span>
              </div>
              <div className="progress-bg">
                <motion.div className="progress-fill" style={{ background: '#7C9082' }}
                  initial={{ width: 0 }} animate={{ width: `${delta.quality_after}%` }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <span className="px-4 py-1.5 bg-green-50 text-[#7C9082] rounded-full text-sm font-bold">
              ↑ {delta.quality_after - delta.quality_before}% improvement
            </span>
          </div>
        </NordicCard>
      )}

      {/* Side-by-side tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NordicCard title="Original Dataset" subtitle="First 5 rows (unmodified)" icon={SplitSquareHorizontal} color="mustard">
          <DataTable rows={originalRows} isOriginal={true} label="ORIGINAL" />
        </NordicCard>

        <NordicCard title="Cleaned Dataset" subtitle="Green = nulls filled · Amber = value corrected" icon={SplitSquareHorizontal} color="sage">
          <DataTable rows={cleanedRows} originalRows={originalRows} isOriginal={false} label="CLEANED" />
        </NordicCard>
      </div>

      {/* Legend */}
      <div className="flex gap-6 text-xs font-semibold text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-[#7C9082]" />
          Null value was filled
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-50 border border-[#D4A373]" />
          Value was corrected / capped
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#F8F2F0] text-[#C88272] rounded text-[10px] font-bold">NULL</span>
          Missing value (original)
        </div>
      </div>
    </div>
  );
}
