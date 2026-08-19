/**
 * Visualizations Suite — All-in-One Data Science & Quality Charts
 * Includes:
 *  - Missing Values Matrix & Completeness
 *  - Outlier Bar (IQR vs Z-Score)
 *  - 5-Number Box Plot Quartile Spread
 *  - Frequency Distribution Histogram
 *  - Categorical Class Balance Doughnut
 *  - Feature Correlation Heatmap Matrix
 *  - Interactive Bivariate X-Y Scatter Plot
 *  - Multi-dimensional Quality Radar
 */
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, GitBranch, TrendingUp, AlertOctagon, RefreshCw,
  ChevronDown, PieChart, ScatterChart as ScatterIcon, ShieldCheck,
  Layers, Sliders
} from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import MissingHeatmap from '../components/charts/MissingHeatmap';
import CorrelationMatrix from '../components/charts/CorrelationMatrix';
import DistributionPlot from '../components/charts/DistributionPlot';
import BoxPlotChart from '../components/charts/BoxPlotChart';
import QualityDashboard from '../components/charts/QualityDashboard';
import ClassBalanceChart from '../components/charts/ClassBalanceChart';
import ScatterPlotChart from '../components/charts/ScatterPlotChart';
import BoxPlotSpreadChart from '../components/charts/BoxPlotSpreadChart';
import useAppStore from '../store/useAppStore';
import { getVisualizations } from '../api/client';
import toast from 'react-hot-toast';

export default function Visualizations() {
  const { currentDataset, analysisResult } = useAppStore();

  const [vizData, setVizData]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [selectedCol, setSelectedCol]   = useState('');
  const [scatterX, setScatterX]         = useState('');
  const [scatterY, setScatterY]         = useState('');
  const [activeTab, setActiveTab]       = useState('all'); // all | missing | distribution | correlation | quality

  // Derive column list from analysis result or preview
  const columns = useMemo(() => {
    return analysisResult?.columns?.map(c => c.column_name)
      || (currentDataset?.preview?.length ? Object.keys(currentDataset.preview[0]) : []);
  }, [analysisResult, currentDataset]);

  // Derive numeric columns
  const numericColumns = useMemo(() => {
    if (analysisResult?.columns) {
      return analysisResult.columns
        .filter(c => c.dtype === 'numeric' || c.dtype === 'float64' || c.dtype === 'int64')
        .map(c => c.column_name);
    }
    return columns;
  }, [analysisResult, columns]);

  // Fetch visualization data from backend
  const fetchViz = async () => {
    if (!currentDataset?.id) return;
    setLoading(true);
    try {
      const res = await getVisualizations(currentDataset.id);
      setVizData(res.data);
      if (!selectedCol && columns.length > 0) {
        setSelectedCol(columns[0]);
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
    if (columns.length > 0) {
      if (!selectedCol) setSelectedCol(columns[0]);
      if (!scatterX && numericColumns.length > 0) setScatterX(numericColumns[0]);
      if (!scatterY && numericColumns.length > 1) setScatterY(numericColumns[1]);
      else if (!scatterY && numericColumns.length > 0) setScatterY(numericColumns[0]);
    }
  }, [currentDataset?.id, columns, numericColumns]);

  // Missing values data
  const missingData = useMemo(() => {
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
  }, [analysisResult, vizData]);

  // Correlation matrix data
  const correlationData = useMemo(() => {
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
  }, [vizData, analysisResult]);

  // Distribution data for selected column
  const distData = useMemo(() => {
    const dist = vizData?.distributions?.[selectedCol];
    if (dist?.labels && dist?.counts) {
      return {
        labels: dist.labels.map(l => (typeof l === 'number' ? l.toFixed(1) : String(l))),
        values: dist.counts,
      };
    }
    return undefined;
  }, [vizData, selectedCol]);

  // Outlier comparison data (IQR vs ZScore)
  const outlierData = useMemo(() => {
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
  }, [analysisResult, vizData]);

  // Class balance data for selected column
  const classData = useMemo(() => {
    return vizData?.class_balances?.[selectedCol] || distData;
  }, [vizData, selectedCol, distData]);

  // Boxplot spread data for selected column
  const boxData = useMemo(() => {
    return vizData?.boxplots?.[selectedCol];
  }, [vizData, selectedCol]);

  // Scatter plot points (derived from preview or random sample if not in backend)
  const scatterPoints = useMemo(() => {
    const preview = currentDataset?.cleanedPreview || currentDataset?.preview || [];
    if (!preview.length || !scatterX || !scatterY) return [];
    return preview
      .map(row => ({
        x: parseFloat(row[scatterX]),
        y: parseFloat(row[scatterY]),
      }))
      .filter(p => !isNaN(p.x) && !isNaN(p.y));
  }, [currentDataset, scatterX, scatterY]);

  const scores = analysisResult?.quality_score || {};

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Visualizations Suite</h2>
          <p className="text-gray-500 font-medium">
            {currentDataset
              ? `Interactive exploratory analysis & quality visualizer for ${currentDataset.name || 'Dataset'}`
              : 'Upload a dataset to view live charts'}
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {columns.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-1.5 shadow-sm">
              <span className="text-xs font-bold text-gray-400 uppercase">Focus Column:</span>
              <select
                value={selectedCol}
                onChange={e => setSelectedCol(e.target.value)}
                className="bg-transparent text-gray-800 font-bold text-xs outline-none cursor-pointer pr-4"
              >
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <button
            onClick={fetchViz}
            disabled={loading || !currentDataset?.id}
            className="btn-nd btn-nd-secondary text-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Category Tab Bar */}
      <div className="flex gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl w-fit flex-wrap">
        {[
          { id: 'all',          label: 'All Visualizations',  icon: Layers },
          { id: 'missing',      label: 'Missing & Health',    icon: BarChart2 },
          { id: 'distribution', label: 'Distributions & Box', icon: TrendingUp },
          { id: 'correlation',  label: 'Relationships & X-Y',icon: GitBranch },
          { id: 'quality',      label: 'Quality Dimensions',  icon: ShieldCheck },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CHARTS CONTAINER ── */}
      <div className="flex flex-col gap-6">

        {/* ROW 1: Missing Values & Outlier Comparisons */}
        {(activeTab === 'all' || activeTab === 'missing') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <NordicCard
                title="Missing Values by Column"
                subtitle="Columns sorted by missing value percentage"
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

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <NordicCard
                title="Outlier Detection Comparison"
                subtitle="IQR Method vs Z-Score Method (threshold 3.0)"
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
        )}

        {/* ROW 2: Distribution Histogram & 5-Number Box Plot Spread */}
        {(activeTab === 'all' || activeTab === 'distribution') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <NordicCard
                title={`Distribution Histogram — ${selectedCol || 'Select Column'}`}
                subtitle="Frequency binning & density profile"
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

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <NordicCard
                title={`5-Number Box Plot Spread — ${selectedCol || 'Select Column'}`}
                subtitle="Min, Q1 (25%), Median, Q3 (75%), Max & Outliers"
                icon={Sliders}
                color="dusty"
                className="h-96"
                animate={false}
              >
                <div className="flex-1 min-h-0 mt-2">
                  <BoxPlotSpreadChart boxData={boxData} column={selectedCol} />
                </div>
              </NordicCard>
            </motion.div>
          </div>
        )}

        {/* ROW 3: Correlation Matrix & Interactive X-Y Scatter Plot */}
        {(activeTab === 'all' || activeTab === 'correlation') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <NordicCard
                title="Feature Correlation Matrix"
                subtitle="Pairwise Pearson correlation coefficients (Sage = +1, Terracotta = -1)"
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

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <NordicCard
                title={`Bivariate Scatter Plot (${scatterX || 'X'} vs ${scatterY || 'Y'})`}
                subtitle="Inspect pairwise relationships, clusters & outliers"
                icon={ScatterIcon}
                color="sage"
                className="h-96"
                animate={false}
              >
                {/* X & Y Column Selectors inside the card */}
                <div className="flex items-center gap-3 mb-2 px-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <span>X:</span>
                    <select
                      value={scatterX}
                      onChange={e => setScatterX(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none"
                    >
                      {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <span>Y:</span>
                    <select
                      value={scatterY}
                      onChange={e => setScatterY(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 outline-none"
                    >
                      {numericColumns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex-1 min-h-0">
                  <ScatterPlotChart points={scatterPoints} xCol={scatterX} yCol={scatterY} />
                </div>
              </NordicCard>
            </motion.div>
          </div>
        )}

        {/* ROW 4: Quality Radar & Categorical Class Balance */}
        {(activeTab === 'all' || activeTab === 'quality') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <NordicCard
                title="6-Dimension Quality Radar"
                subtitle="Completeness, Consistency, Accuracy, Uniqueness, Validity, Integrity"
                icon={ShieldCheck}
                color="sage"
                className="h-96"
                animate={false}
              >
                <div className="flex-1 min-h-0 mt-2">
                  <QualityDashboard scores={scores} />
                </div>
              </NordicCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <NordicCard
                title={`Class Balance / Category Split — ${selectedCol || 'Select Column'}`}
                subtitle="Proportions across unique category classes"
                icon={PieChart}
                color="mustard"
                className="h-96"
                animate={false}
              >
                <div className="flex-1 min-h-0 mt-2">
                  <ClassBalanceChart data={classData} column={selectedCol} />
                </div>
              </NordicCard>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
