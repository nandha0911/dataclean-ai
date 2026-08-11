/**
 * Visualizations — Nordic Light
 * Fetches live visualization data from backend and renders all 4 charts.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, GitBranch, TrendingUp, AlertOctagon, RefreshCw, ChevronDown } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import MissingHeatmap from '../components/charts/MissingHeatmap';
import CorrelationMatrix from '../components/charts/CorrelationMatrix';
import DistributionPlot from '../components/charts/DistributionPlot';
import BoxPlotChart from '../components/charts/BoxPlotChart';
import useAppStore from '../store/useAppStore';
import { getVisualizations } from '../api/client';
import toast from 'react-hot-toast';

export default function Visualizations() {
  const { currentDataset, analysisResult } = useAppStore();

  const [vizData, setVizData]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [selectedCol, setSelectedCol] = useState('');

  // Derive column list from analysis result or current dataset
  const columns = analysisResult?.columns?.map(c => c.column_name)
    || (currentDataset?.preview?.length ? Object.keys(currentDataset.preview[0]) : []);

  // Fetch visualization data from backend
  const fetchViz = async () => {
    if (!currentDataset?.id) return;
    setLoading(true);
    try {
      const res = await getVisualizations(currentDataset.id);
      setVizData(res.data);
      if (!selectedCol) {
        const availableCols = Object.keys(res.data?.distributions || {});
        if (availableCols.length > 0) setSelectedCol(availableCols[0]);
      }
    } catch (err) {
      console.error('Viz fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentDataset?.id) {
      fetchViz();
    }
    if (!selectedCol && columns.length) setSelectedCol(columns[0]);
  }, [currentDataset?.id]);

  // Transform missing_heatmap into format expected by MissingHeatmap component
  const missingData = (() => {
    if (analysisResult?.columns) {
      return analysisResult.columns.map(c => ({
        column: c.column_name,
        missing_pct: c.missing_pct ?? 0,
        missing_count: c.missing_count ?? 0,
      }));
    }
    if (vizData?.missing_heatmap?.columns) {
      const cols = vizData.missing_heatmap.columns;
      const matrix = vizData.missing_heatmap.data || [];
      const totalRows = matrix.length || 1;
      return cols.map((col, colIdx) => {
        const missingCount = matrix.reduce((acc, row) => acc + (row[colIdx] === 1 ? 1 : 0), 0);
        return {
          column: col,
          missing_pct: (missingCount / totalRows) * 100,
          missing_count: missingCount,
        };
      });
    }
    return undefined;
  })();

  // Transform correlation_matrix for CorrelationMatrix component
  const correlationData = (() => {
    if (vizData?.correlation_matrix?.columns && vizData?.correlation_matrix?.data) {
      return {
        columns: vizData.correlation_matrix.columns,
        matrix: vizData.correlation_matrix.data,
      };
    }
    if (analysisResult?.correlation_matrix) {
      const cols = Object.keys(analysisResult.correlation_matrix);
      const matrix = cols.map(c1 => cols.map(c2 => analysisResult.correlation_matrix[c1]?.[c2] ?? 0));
      return { columns: cols, matrix };
    }
    return undefined;
  })();

  // Transform distribution data for selected column
  const distData = (() => {
    const dist = vizData?.distributions?.[selectedCol];
    if (dist?.labels && dist?.counts) {
      return {
        labels: dist.labels.map(l => (typeof l === 'number' ? l.toFixed(1) : String(l))),
        values: dist.counts,
      };
    }
    return undefined;
  })();

  // Transform outlier data for BoxPlotChart component
  const outlierData = (() => {
    if (analysisResult?.columns) {
      return analysisResult.columns.map(c => ({
        column: c.column_name,
        outliers_iqr: c.outliers_iqr ?? 0,
        outliers_zscore: c.outliers_zscore ?? 0,
      }));
    }
    if (vizData?.boxplots) {
      return Object.keys(vizData.boxplots).map(col => ({
        column: col,
        outliers_iqr: vizData.boxplots[col]?.outliers?.length ?? 0,
        outliers_zscore: vizData.boxplots[col]?.outliers?.length ?? 0,
      }));
    }
    return undefined;
  })();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Visualizations</h2>
          <p className="text-gray-500 font-medium">
            {currentDataset
              ? `Exploring patterns in ${currentDataset.name}`
              : 'Upload a dataset to view live charts'}
          </p>
        </div>
        <div className="flex gap-3">
          {columns.length > 0 && (
            <div className="relative">
              <select
                value={selectedCol}
                onChange={e => setSelectedCol(e.target.value)}
                className="appearance-none pr-10 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-full px-4 py-2.5 shadow-sm cursor-pointer focus:ring-2 focus:ring-gray-200"
              >
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
            </div>
          )}
          <button
            onClick={fetchViz}
            disabled={loading || !currentDataset?.id}
            className="btn-nd btn-nd-secondary"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Row 1: Missing Values + Outliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <NordicCard
            title="Missing Values by Column"
            subtitle="Sorted by missing percentage"
            icon={BarChart2}
            color="terra"
            className="h-96"
            animate={false}
          >
            <div className="flex-1 min-h-0 mt-2">
              <MissingHeatmap data={missingData} />
            </div>
          </NordicCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <NordicCard
            title="Outlier Count by Column"
            subtitle="IQR method vs Z-Score method"
            icon={AlertOctagon}
            color="mustard"
            className="h-96"
            animate={false}
          >
            <div className="flex-1 min-h-0 mt-2">
              <BoxPlotChart data={outlierData} />
            </div>
          </NordicCard>
        </motion.div>
      </div>

      {/* Row 2: Distribution + Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <NordicCard
            title={`Distribution — ${selectedCol || 'Select a column'}`}
            subtitle="Frequency histogram"
            icon={TrendingUp}
            color="sage"
            className="h-96"
            animate={false}
          >
            <div className="flex-1 min-h-0 mt-2">
              <DistributionPlot
                column={selectedCol}
                labels={distData?.labels}
                values={distData?.values}
              />
            </div>
          </NordicCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <NordicCard
            title="Feature Correlation Matrix"
            subtitle="Hover cells for exact value · Sage = positive · Terracotta = negative"
            icon={GitBranch}
            color="dusty"
            className="h-96"
            animate={false}
          >
            <div className="flex-1 min-h-0 mt-2">
              <CorrelationMatrix data={correlationData} />
            </div>
          </NordicCard>
        </motion.div>
      </div>
    </div>
  );
}
