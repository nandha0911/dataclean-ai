/**
 * RecommendationCard
 * ====================
 * Displays a single AI recommendation with confidence, reason,
 * expandable advantages/disadvantages, alternatives, and apply button.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
  Zap, TrendingUp, Info
} from 'lucide-react';
import RetroProgress from './ui/RetroProgress';

const CATEGORY_COLORS = {
  missing:    { border: '#00FFFF', text: '#00FFFF', bg: 'rgba(0,255,255,0.06)' },
  outlier:    { border: '#FFB000', text: '#FFB000', bg: 'rgba(255,176,0,0.06)' },
  encoding:   { border: '#FF00FF', text: '#FF00FF', bg: 'rgba(255,0,255,0.06)' },
  scaling:    { border: '#FF6600', text: '#FF6600', bg: 'rgba(255,102,0,0.06)' },
  structural: { border: '#FF0099', text: '#FF0099', bg: 'rgba(255,0,153,0.06)' },
  default:    { border: '#39FF14', text: '#39FF14', bg: 'rgba(57,255,20,0.06)'  },
};

export default function RecommendationCard({ recommendation, onApply, index, applied }) {
  const [expanded, setExpanded] = useState(false);

  // Support both old shape (issue/action/details) and new shape (problem/recommendation/advantages)
  const {
    column,
    problem   = recommendation.issue,
    recommendation: technique = recommendation.action,
    confidence = 85,
    reason,
    advantages = recommendation.details?.pros || [],
    disadvantages = recommendation.details?.cons || [],
    alternatives = [],
    expected_improvement,
    category = 'default',
  } = recommendation;

  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  const confNum = typeof confidence === 'number' ? confidence : parseFloat(confidence) || 85;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <div
        className="border transition-all duration-300"
        style={{
          borderColor: applied ? '#39FF14' : colors.border,
          backgroundColor: applied ? 'rgba(57,255,20,0.04)' : colors.bg,
          boxShadow: applied
            ? '0 0 16px rgba(57,255,20,0.2)'
            : `0 0 8px ${colors.border}20`,
        }}
      >
        {/* Card Header */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{
            backgroundColor: applied ? 'rgba(57,255,20,0.15)' : `${colors.border}18`,
            borderBottom: `1px solid ${colors.border}40`,
          }}
        >
          <div className="flex items-center gap-2">
            {applied
              ? <CheckCircle size={14} style={{ color: '#39FF14' }} />
              : <AlertTriangle size={14} style={{ color: colors.text }} />
            }
            <span className="font-heading text-xs" style={{ color: colors.text }}>
              {applied ? 'APPLIED: ' : 'COLUMN: '}
              {column?.toUpperCase()}
            </span>
          </div>
          <span
            className="text-xs font-mono px-2 py-0.5 border"
            style={{ borderColor: colors.border, color: colors.text }}
          >
            {(category || 'general').toUpperCase()}
          </span>
        </div>

        {/* Main Content */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

            {/* Left: Problem + Reason */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-1 flex-shrink-0" style={{ color: '#FF00FF' }} />
                <span className="font-mono text-sm" style={{ color: '#FF00FF' }}>{problem}</span>
              </div>

              <div>
                <span className="font-mono text-xs" style={{ color: '#555' }}>AI REASON: </span>
                <span className="font-mono text-sm" style={{ color: '#aaa' }}>{reason}</span>
              </div>

              {/* Technique badge */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="font-mono text-xs" style={{ color: '#555' }}>RECOMMENDED:</span>
                <motion.span
                  whileHover={{ boxShadow: `0 0 12px ${colors.border}` }}
                  className="px-3 py-1 font-mono font-bold text-sm border"
                  style={{
                    borderColor: '#39FF14',
                    color: '#39FF14',
                    backgroundColor: 'rgba(57,255,20,0.08)',
                    boxShadow: '0 0 6px rgba(57,255,20,0.3)',
                  }}
                >
                  ⚡ {technique}
                </motion.span>
              </div>

              {/* Alternatives */}
              {alternatives?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <span className="font-mono text-xs" style={{ color: '#444' }}>ALT: </span>
                  {alternatives.map((alt, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 border font-mono"
                      style={{ borderColor: '#333', color: '#555' }}
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Confidence + Apply */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1" style={{ color: colors.text }}>
                  <span>CONFIDENCE</span>
                  <span>{confNum}%</span>
                </div>
                <div className="h-2 border" style={{ borderColor: colors.border, backgroundColor: '#0a0a0a' }}>
                  <motion.div
                    className="h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${confNum}%` }}
                    transition={{ duration: 1, delay: index * 0.08 + 0.3 }}
                    style={{
                      backgroundColor: colors.border,
                      boxShadow: `0 0 6px ${colors.border}`,
                    }}
                  />
                </div>
              </div>

              {expected_improvement && (
                <div className="text-xs font-mono" style={{ color: '#39FF14', opacity: 0.8 }}>
                  <TrendingUp size={10} className="inline mr-1" />
                  {expected_improvement}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 16px rgba(57,255,20,0.5)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onApply}
                disabled={applied}
                className="w-full py-2 font-mono text-sm border flex items-center justify-center gap-2 transition-all"
                style={{
                  borderColor: applied ? '#39FF14' : '#39FF14',
                  color: applied ? '#39FF14' : '#39FF14',
                  backgroundColor: applied ? 'rgba(57,255,20,0.15)' : 'rgba(57,255,20,0.05)',
                  opacity: applied ? 0.7 : 1,
                }}
              >
                <Zap size={14} />
                {applied ? 'APPLIED ✓' : 'APPLY FIX'}
              </motion.button>
            </div>
          </div>

          {/* Expandable details */}
          <div className="mt-3 border-t" style={{ borderColor: '#1a1a1a' }}>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-2 w-full justify-center py-2 font-mono text-xs transition-colors"
              style={{ color: '#444' }}
              onMouseEnter={e => e.currentTarget.style.color = '#39FF14'}
              onMouseLeave={e => e.currentTarget.style.color = '#444'}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'COLLAPSE ANALYSIS' : 'VIEW FULL ANALYSIS'}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-3 mt-1 font-mono text-sm grid grid-cols-1 md:grid-cols-2 gap-4"
                    style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' }}
                  >
                    <div>
                      <h4 className="text-xs font-bold mb-2 pb-1" style={{ color: '#39FF14', borderBottom: '1px solid #1a1a1a' }}>
                        ✓ ADVANTAGES
                      </h4>
                      <ul className="space-y-1">
                        {(advantages || []).map((pro, i) => (
                          <li key={i} className="text-xs flex gap-2" style={{ color: '#888' }}>
                            <span style={{ color: '#39FF14' }}>▸</span>{pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold mb-2 pb-1" style={{ color: '#FF00FF', borderBottom: '1px solid #1a1a1a' }}>
                        ✗ LIMITATIONS
                      </h4>
                      <ul className="space-y-1">
                        {(disadvantages || []).map((con, i) => (
                          <li key={i} className="text-xs flex gap-2" style={{ color: '#888' }}>
                            <span style={{ color: '#FF00FF' }}>▸</span>{con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
