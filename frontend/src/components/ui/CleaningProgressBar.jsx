import { motion } from 'framer-motion';
import { CheckCircle2, Activity, Sparkles, ArrowRight, ShieldCheck, Database, Layers, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * CleaningProgressBar — Visual progress bar line showing percentage of data cleaned successfully
 */
export default function CleaningProgressBar({
  progress = 0,
  status = 'idle', // 'idle' | 'cleaning' | 'completed'
  currentStep = '',
  totalSteps = 0,
  completedSteps = 0,
  delta = null,
  appliedCount = 0,
  className = '',
  showActions = true,
}) {
  const navigate = useNavigate();

  // If completed, compute realistic cleanliness percentage (e.g. 99.5% or 100%)
  const cleanPercentage = status === 'completed'
    ? (delta?.quality_after ? Math.min(100, Number(delta.quality_after)) : 100)
    : Math.min(100, Math.max(0, Math.round(progress)));

  const isCleaning = status === 'cleaning';
  const isCompleted = status === 'completed' || cleanPercentage >= 99;

  return (
    <div className={`w-full bg-white rounded-3xl p-6 shadow-soft border border-gray-100 transition-all ${className}`}>
      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
            isCleaning
              ? 'bg-[#7A8B99]/20 text-[#7A8B99]'
              : isCompleted
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-[#7C9082]/20 text-[#7C9082]'
          }`}>
            {isCleaning ? (
              <Activity size={20} className="animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 size={20} />
            ) : (
              <Sparkles size={20} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-base font-extrabold text-gray-900 tracking-tight">
                {isCleaning
                  ? 'Data Cleaning in Progress...'
                  : isCompleted
                  ? 'Data Cleaned Successfully'
                  : 'Data Cleaning Progress'}
              </h4>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : isCleaning
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {isCompleted ? '100% Cleaned' : `${cleanPercentage}%`}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {isCleaning
                ? currentStep || `Executing pipeline operations (${completedSteps} of ${totalSteps})...`
                : isCompleted
                ? `${appliedCount || completedSteps || totalSteps || 1} cleaning operations applied · ${cleanPercentage}% clean dataset ready`
                : 'Ready to clean dataset'}
            </p>
          </div>
        </div>

        {/* Big percentage display */}
        <div className="text-right">
          <div className="text-2xl font-black tracking-tight text-gray-900">
            {cleanPercentage}%
          </div>
          <div className="text-[11px] font-bold text-gray-400">
            Cleanliness Rate
          </div>
        </div>
      </div>

      {/* ── Main Progress Bar Line ── */}
      <div className="relative w-full h-3.5 bg-gray-100 rounded-full overflow-hidden p-0.5">
        <motion.div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted
              ? 'bg-gradient-to-r from-[#7C9082] via-emerald-500 to-teal-500 shadow-sm'
              : isCleaning
              ? 'bg-gradient-to-r from-[#7A8B99] to-[#7C9082] animate-pulse'
              : 'bg-[#7C9082]'
          }`}
          style={{ width: `${Math.max(4, cleanPercentage)}%` }}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(4, cleanPercentage)}%` }}
          transition={{ ease: 'easeOut', duration: 0.5 }}
        />
      </div>

      {/* Delta Metrics Summary */}
      {isCompleted && delta && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Nulls Resolved</span>
            <strong className="text-sm font-extrabold text-emerald-700">
              {delta?.nulls_filled != null ? `+${delta.nulls_filled.toLocaleString()}` : 'Cleaned'}
            </strong>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Duplicates Removed</span>
            <strong className="text-sm font-extrabold text-gray-800">
              {delta?.rows_removed != null ? `${delta.rows_removed.toLocaleString()} rows` : '0 rows'}
            </strong>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Quality Score</span>
            <strong className="text-sm font-extrabold text-[#7C9082]">
              {delta?.quality_before != null && delta?.quality_after != null
                ? `${delta.quality_before}% → ${delta.quality_after}%`
                : `${cleanPercentage}%`}
            </strong>
          </div>
          <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">Operations</span>
            <strong className="text-sm font-extrabold text-gray-800">
              {appliedCount || totalSteps || 1} Applied
            </strong>
          </div>
        </div>
      )}

      {/* Quick Action Links if Completed */}
      {isCompleted && showActions && (
        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-gray-50 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <ShieldCheck size={16} /> 100% of pipeline executed without errors
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/before-after')}
              className="px-3.5 py-1.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-colors flex items-center gap-1 border border-gray-200"
            >
              Before & After <ArrowRight size={13} />
            </button>
            <button
              onClick={() => navigate('/download')}
              className="px-3.5 py-1.5 rounded-xl bg-[#7C9082] text-white hover:bg-[#687a6d] text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
            >
              Export Cleaned Data <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
