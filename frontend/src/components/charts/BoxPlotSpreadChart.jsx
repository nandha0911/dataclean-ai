/**
 * BoxPlotSpreadChart — 5-Number Summary & Spread visualizer
 */
import { motion } from 'framer-motion';

export default function BoxPlotSpreadChart({ boxData, column }) {
  if (!boxData || boxData.min === undefined || boxData.max === undefined) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs font-medium py-10">
        No boxplot distribution data for {column || 'this column'}
      </div>
    );
  }

  const { min, q1, median, q3, max, outliers = [] } = boxData;
  const range = max - min || 1;

  const getPercent = (val) => Math.max(0, Math.min(100, ((val - min) / range) * 100));

  const pMin = 0;
  const pQ1 = getPercent(q1);
  const pMed = getPercent(median);
  const pQ3 = getPercent(q3);
  const pMax = 100;

  return (
    <div className="flex flex-col justify-center h-full px-4 py-2">
      {/* Visual Box & Whisker Line */}
      <div className="relative h-20 flex items-center">
        {/* Whisker Background Line */}
        <div className="absolute w-full h-1 bg-gray-200 rounded-full" />

        {/* Active Range Line between Min and Max */}
        <div className="absolute h-1 bg-[#7C9082]" style={{ left: '0%', width: '100%' }} />

        {/* Min Whisker Cap */}
        <div className="absolute w-1 h-6 bg-[#7C9082] rounded-full" style={{ left: '0%' }} />

        {/* Max Whisker Cap */}
        <div className="absolute w-1 h-6 bg-[#7C9082] rounded-full" style={{ left: '100%', transform: 'translateX(-100%)' }} />

        {/* IQR Box (Q1 to Q3) */}
        <motion.div
          initial={{ opacity: 0, scaleY: 0.5 }}
          animate={{ opacity: 1, scaleY: 1 }}
          className="absolute h-12 bg-[#7C9082]/20 border-2 border-[#7C9082] rounded-xl flex items-center justify-center shadow-sm"
          style={{
            left: `${pQ1}%`,
            width: `${Math.max(4, pQ3 - pQ1)}%`,
          }}
        >
          {/* Median Divider */}
          <div
            className="absolute w-1 h-12 bg-[#C88272] shadow-sm rounded-full"
            style={{
              left: `${((pMed - pQ1) / (pQ3 - pQ1 || 1)) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          />
        </motion.div>

        {/* Outlier Dots */}
        {outliers.map((outVal, idx) => {
          const pOut = getPercent(outVal);
          return (
            <div
              key={idx}
              title={`Outlier: ${outVal}`}
              className="absolute w-2.5 h-2.5 rounded-full bg-[#C88272] border-2 border-white shadow-sm"
              style={{ left: `${pOut}%`, transform: 'translate(-50%, -18px)' }}
            />
          );
        })}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-2 mt-4 text-center">
        <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Min</div>
          <div className="text-xs font-bold text-gray-800">{typeof min === 'number' ? min.toFixed(2) : min}</div>
        </div>
        <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Q1 (25%)</div>
          <div className="text-xs font-bold text-gray-800">{typeof q1 === 'number' ? q1.toFixed(2) : q1}</div>
        </div>
        <div className="p-2 bg-[#FAF0EE] rounded-xl border border-[#C88272]/20">
          <div className="text-[10px] font-bold text-[#C88272] uppercase">Median (Q2)</div>
          <div className="text-xs font-bold text-[#C88272]">{typeof median === 'number' ? median.toFixed(2) : median}</div>
        </div>
        <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Q3 (75%)</div>
          <div className="text-xs font-bold text-gray-800">{typeof q3 === 'number' ? q3.toFixed(2) : q3}</div>
        </div>
        <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Max</div>
          <div className="text-xs font-bold text-gray-800">{typeof max === 'number' ? max.toFixed(2) : max}</div>
        </div>
      </div>

      {outliers.length > 0 && (
        <div className="mt-3 text-center text-xs font-semibold text-[#C88272]">
          ⚠️ {outliers.length} outlier points detected outside IQR boundary
        </div>
      )}
    </div>
  );
}
