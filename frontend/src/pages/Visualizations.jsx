/**
 * Visualizations Suite — Complete 80-Chart Interactive Catalog & Dashboard
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, RefreshCw, BarChart2, Layers, Grid, Sliders,
  Sparkles, CheckCircle2, ChevronRight, Eye
} from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import UniversalChartEngine from '../components/charts/UniversalChartEngine';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';

// ── Complete 80 Chart Taxonomy ───────────────────────────────────────────────
export const ALL_80_CHARTS = [
  // 1. Basic & Distributions (1–14)
  { id: 1, name: 'Bar Chart', category: 'Basic & Distributions', desc: 'Categorical frequency and metric comparisons' },
  { id: 2, name: 'Horizontal Bar Chart', category: 'Basic & Distributions', desc: 'Ranking categories with long text labels' },
  { id: 3, name: 'Grouped Bar Chart', category: 'Basic & Distributions', desc: 'Multi-category side-by-side metric comparison' },
  { id: 4, name: 'Stacked Bar Chart', category: 'Basic & Distributions', desc: 'Part-to-whole segment distributions' },
  { id: 5, name: 'Histogram', category: 'Basic & Distributions', desc: 'Continuous numeric frequency binning' },
  { id: 6, name: 'Line Chart', category: 'Basic & Distributions', desc: 'Trend analysis across sequence or time series' },
  { id: 7, name: 'Pie Chart', category: 'Basic & Distributions', desc: 'Proportional breakdown of parts to a whole' },
  { id: 8, name: 'Donut Chart', category: 'Basic & Distributions', desc: 'Clean ring distribution with center metric' },
  { id: 9, name: 'Scatter Plot', category: 'Basic & Distributions', desc: 'Bivariate relationship and correlation pattern' },
  { id: 10, name: 'Box Plot', category: 'Basic & Distributions', desc: '5-number summary (Min, Q1, Median, Q3, Max)' },
  { id: 11, name: 'Violin Plot', category: 'Basic & Distributions', desc: 'Kernel density and probability distribution shape' },
  { id: 12, name: 'KDE Plot', category: 'Basic & Distributions', desc: 'Smoothed continuous probability density curve' },
  { id: 13, name: 'Count Plot', category: 'Basic & Distributions', desc: 'Discrete observation count per category' },
  { id: 14, name: 'Area Chart', category: 'Basic & Distributions', desc: 'Cumulative volume and magnitude over sequence' },

  // 2. Relational & Statistical (15–30)
  { id: 15, name: 'Heatmap', category: 'Relational & Statistical', desc: '2D matrix value intensity shading' },
  { id: 16, name: 'Correlation Heatmap', category: 'Relational & Statistical', desc: 'Pairwise Pearson correlation coefficients' },
  { id: 17, name: 'Pair Plot', category: 'Relational & Statistical', desc: 'Pairwise multivariate scatter grid' },
  { id: 18, name: 'Bubble Chart', category: 'Relational & Statistical', desc: '3-variable relational plot (X, Y, Size)' },
  { id: 19, name: 'Lollipop Chart', category: 'Relational & Statistical', desc: 'Clean line-to-dot ranking visualization' },
  { id: 20, name: 'Dot Plot', category: 'Relational & Statistical', desc: 'Minimalist discrete data point positioning' },
  { id: 21, name: 'ECDF Plot', category: 'Relational & Statistical', desc: 'Empirical cumulative distribution function' },
  { id: 22, name: 'Rug Plot', category: 'Relational & Statistical', desc: 'Marginal 1D tick marks along axes' },
  { id: 23, name: 'Strip Plot', category: 'Relational & Statistical', desc: 'Jittered single-axis categorical observations' },
  { id: 24, name: 'Swarm Plot', category: 'Relational & Statistical', desc: 'Non-overlapping point distribution visualizer' },
  { id: 25, name: 'QQ Plot', category: 'Relational & Statistical', desc: 'Quantile-Quantile normality validation' },
  { id: 26, name: 'PP Plot', category: 'Relational & Statistical', desc: 'Probability-Probability cumulative assessment' },
  { id: 27, name: 'Regression Plot', category: 'Relational & Statistical', desc: 'Scatter plot with best-fit trendline' },
  { id: 28, name: 'Joint Plot', category: 'Relational & Statistical', desc: 'Bivariate scatter with marginal histograms' },
  { id: 29, name: 'Residual Plot', category: 'Relational & Statistical', desc: 'Error residual distribution for linear models' },
  { id: 30, name: 'Error Bar Plot', category: 'Relational & Statistical', desc: 'Confidence interval and standard error bands' },

  // 3. Hierarchical & Flow (31–40)
  { id: 31, name: 'Treemap', category: 'Hierarchical & Flow', desc: 'Nested rectangular space-filling hierarchy' },
  { id: 32, name: 'Sunburst Chart', category: 'Hierarchical & Flow', desc: 'Radial multi-level hierarchical breakdown' },
  { id: 33, name: 'Waterfall Chart', category: 'Hierarchical & Flow', desc: 'Cumulative incremental positive/negative steps' },
  { id: 34, name: 'Funnel Chart', category: 'Hierarchical & Flow', desc: 'Sequential stage-by-stage conversion drop-off' },
  { id: 35, name: 'Pareto Chart', category: 'Hierarchical & Flow', desc: '80/20 rule cumulative contribution frequency' },
  { id: 36, name: 'Radar Chart', category: 'Hierarchical & Flow', desc: 'Multi-dimensional 360-degree quality radar' },
  { id: 37, name: 'Parallel Coordinates', category: 'Hierarchical & Flow', desc: 'High-dimensional multi-axis feature lines' },
  { id: 38, name: 'Sankey Diagram', category: 'Hierarchical & Flow', desc: 'Flow volume and node transformation transfer' },
  { id: 39, name: 'Dendrogram', category: 'Hierarchical & Flow', desc: 'Hierarchical clustering tree structure' },
  { id: 40, name: 'Network Graph', category: 'Hierarchical & Flow', desc: 'Entity nodes and relational edge connections' },

  // 4. Geospatial & Maps (41–47)
  { id: 41, name: 'Choropleth Map', category: 'Geospatial & Spatial', desc: 'Geographical regions shaded by metric' },
  { id: 42, name: 'Point Map', category: 'Geospatial & Spatial', desc: 'Geocoded coordinate point markers' },
  { id: 43, name: 'Bubble Map', category: 'Geospatial & Spatial', desc: 'Geographic bubbles scaled by metric value' },
  { id: 44, name: 'Heat Map (Spatial)', category: 'Geospatial & Spatial', desc: 'Geographic density heatmap intensity' },
  { id: 45, name: 'Hexbin Map', category: 'Geospatial & Spatial', desc: 'Hexagonal spatial bin aggregation' },
  { id: 46, name: 'Density Map', category: 'Geospatial & Spatial', desc: 'Continuous spatial density contours' },
  { id: 47, name: 'Flow Map', category: 'Geospatial & Spatial', desc: 'Origin-to-destination geographic paths' },

  // 5. Machine Learning & Models (48–60)
  { id: 48, name: 'Confusion Matrix', category: 'Machine Learning', desc: 'TP, FP, TN, FN classification performance' },
  { id: 49, name: 'ROC Curve', category: 'Machine Learning', desc: 'Receiver operating characteristic & AUC' },
  { id: 50, name: 'Precision-Recall Curve', category: 'Machine Learning', desc: 'Precision vs recall trade-off curve' },
  { id: 51, name: 'Feature Importance Plot', category: 'Machine Learning', desc: 'Relative feature predictive influence' },
  { id: 52, name: 'Decision Boundary', category: 'Machine Learning', desc: 'Classifier partition boundary in 2D space' },
  { id: 53, name: 'Elbow Curve', category: 'Machine Learning', desc: 'Optimal cluster count (k) inertia inflection' },
  { id: 54, name: 'Silhouette Plot', category: 'Machine Learning', desc: 'Cluster separation and cohesion quality' },
  { id: 55, name: 'PCA Plot', category: 'Machine Learning', desc: 'Principal component dimension reduction' },
  { id: 56, name: 't-SNE Plot', category: 'Machine Learning', desc: 'Non-linear manifold cluster visualization' },
  { id: 57, name: 'UMAP Plot', category: 'Machine Learning', desc: 'Uniform manifold topological projection' },
  { id: 58, name: 'SHAP Summary Plot', category: 'Machine Learning', desc: 'Shapley additive global feature impact' },
  { id: 59, name: 'SHAP Dependence Plot', category: 'Machine Learning', desc: 'Feature value vs SHAP contribution value' },
  { id: 60, name: 'Partial Dependence Plot', category: 'Machine Learning', desc: 'Marginal target effect of selected feature' },

  // 6. Text & NLP Analytics (61–67)
  { id: 61, name: 'Word Cloud', category: 'Text & NLP', desc: 'Term frequency scaled visual cloud' },
  { id: 62, name: 'Word Frequency Plot', category: 'Text & NLP', desc: 'Top N vocabulary term occurrence bar' },
  { id: 63, name: 'N-gram Visualization', category: 'Text & NLP', desc: 'Bigram and trigram phrase combinations' },
  { id: 64, name: 'Sentiment Visualization', category: 'Text & NLP', desc: 'Positive, negative, neutral sentiment scores' },
  { id: 65, name: 'Topic Visualization', category: 'Text & NLP', desc: 'LDA topic modeling word clusters' },
  { id: 66, name: 'Text Similarity Heatmap', category: 'Text & NLP', desc: 'Cosine similarity matrix across text corpus' },
  { id: 67, name: 'Word Embedding Plot', category: 'Text & NLP', desc: '2D semantic vector embedding space' },

  // 7. Advanced & Specialized (68–80)
  { id: 68, name: 'Candlestick Chart', category: 'Advanced & Specialized', desc: 'Financial Open-High-Low-Close price action' },
  { id: 69, name: 'OHLC Chart', category: 'Advanced & Specialized', desc: 'Tick-based open-high-low-close bars' },
  { id: 70, name: 'Streamgraph', category: 'Advanced & Specialized', desc: 'Organic flowing stacked area distribution' },
  { id: 71, name: 'Ridgeline Plot', category: 'Advanced & Specialized', desc: 'Stacked density ridge distributions' },
  { id: 72, name: 'Hexbin Plot', category: 'Advanced & Specialized', desc: 'Hexagonal 2D density aggregation' },
  { id: 73, name: 'Contour Plot', category: 'Advanced & Specialized', desc: 'Topographical iso-level density contours' },
  { id: 74, name: 'Chord Diagram', category: 'Advanced & Specialized', desc: 'Circular inter-entity matrix relationships' },
  { id: 75, name: 'Marimekko Chart', category: 'Advanced & Specialized', desc: 'Variable-width mosaic bar distribution' },
  { id: 76, name: 'Bump Chart', category: 'Advanced & Specialized', desc: 'Rank movement over sequential periods' },
  { id: 77, name: 'Slope Chart', category: 'Advanced & Specialized', desc: 'Direct before vs after transition comparison' },
  { id: 78, name: 'Bullet Chart', category: 'Advanced & Specialized', desc: 'Target metric performance vs threshold bands' },
  { id: 79, name: 'Calendar Heatmap', category: 'Advanced & Specialized', desc: 'Day-by-day activity intensity calendar' },
  { id: 80, name: 'Interactive Dashboard', category: 'Advanced & Specialized', desc: 'Unified multi-chart live monitoring panel' },
];

const CATEGORIES = [
  'All 80 Visualizations',
  'Basic & Distributions',
  'Relational & Statistical',
  'Hierarchical & Flow',
  'Geospatial & Spatial',
  'Machine Learning',
  'Text & NLP',
  'Advanced & Specialized'
];

export default function Visualizations() {
  const { currentDataset, analysisResult } = useAppStore();

  const [activeChartId, setActiveChartId] = useState(1);
  const [activeCategory, setActiveCategory] = useState('All 80 Visualizations');
  const [searchQuery, setSearchQuery] = useState('');
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [dashboardMode, setDashboardMode] = useState(false);

  // Extract columns
  const columns = useMemo(() => {
    return analysisResult?.columns?.map(c => c.column_name)
      || (currentDataset?.preview?.length ? Object.keys(currentDataset.preview[0]) : []);
  }, [analysisResult, currentDataset]);

  const dataset = useMemo(() => {
    return currentDataset?.cleanedPreview || currentDataset?.preview || [];
  }, [currentDataset]);

  // Set default columns
  useMemo(() => {
    if (columns.length > 0) {
      if (!xCol) setXCol(columns[0]);
      if (!yCol && columns.length > 1) setYCol(columns[1]);
      else if (!yCol) setYCol(columns[0]);
    }
  }, [columns]);

  // Filtered 80 charts
  const filteredCharts = useMemo(() => {
    return ALL_80_CHARTS.filter(c => {
      const matchCat = activeCategory === 'All 80 Visualizations' || c.category === activeCategory;
      const matchSearch = !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.id).includes(searchQuery.trim());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const activeChart = useMemo(() => {
    return ALL_80_CHARTS.find(c => c.id === activeChartId) || ALL_80_CHARTS[0];
  }, [activeChartId]);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Visualizations Suite</h2>
            <span className="px-2.5 py-0.5 bg-[#7C9082]/15 text-[#7C9082] text-xs font-bold rounded-full">
              80 Chart Types Available
            </span>
          </div>
          <p className="text-gray-500 font-medium mt-1">
            Complete data science, machine learning, statistical & NLP visualization suite.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDashboardMode(!dashboardMode)}
            className={`btn-nd text-xs flex items-center gap-1.5 ${
              dashboardMode ? 'bg-[#7C9082] text-white shadow-soft' : 'btn-nd-secondary'
            }`}
          >
            <Grid size={14} />
            {dashboardMode ? 'Single View Mode' : '80-Chart Multi-Grid'}
          </button>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="flex flex-col gap-3">
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm max-w-lg">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search all 80 visualizations (e.g. Histogram, ROC, SHAP, Violin, Sankey)…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 text-sm outline-none text-gray-800 bg-transparent font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? 'bg-[#7C9082] text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── DASHBOARD MODE: Multi-Grid of Charts ── */}
      {dashboardMode ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharts.map(c => (
            <NordicCard
              key={c.id}
              title={`${c.id}. ${c.name}`}
              subtitle={c.desc}
              icon={BarChart2}
              color="sage"
              className="h-80"
              animate={false}
            >
              <div className="flex-1 min-h-0 mt-2">
                <UniversalChartEngine
                  chartId={c.id}
                  dataset={dataset}
                  columns={columns}
                  xCol={xCol}
                  yCol={yCol}
                  analysisResult={analysisResult}
                />
              </div>
            </NordicCard>
          ))}
        </div>
      ) : (
        /* ── SINGLE VIEW MODE: Interactive Focus Studio ── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column (1 col): 80-Chart Selector List */}
          <div className="lg:col-span-1 flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Select Chart ({filteredCharts.length})
              </span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredCharts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveChartId(c.id)}
                  className={`text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-2 ${
                    activeChartId === c.id
                      ? 'bg-[#F2F5F3] border-[#7C9082] shadow-sm'
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                        #{c.id}
                      </span>
                      <span className={`text-xs font-bold truncate ${activeChartId === c.id ? 'text-[#7C9082]' : 'text-gray-800'}`}>
                        {c.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{c.desc}</p>
                  </div>
                  {activeChartId === c.id && <ChevronRight size={14} className="text-[#7C9082] flex-shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column (3 cols): Active Chart Visualizer & Parameters */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <NordicCard
              title={`${activeChart.id}. ${activeChart.name}`}
              subtitle={activeChart.desc}
              icon={BarChart2}
              color="sage"
              className="min-h-[520px]"
            >
              {/* Feature Dimension Selectors */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Primary X Column */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">X-Axis:</span>
                    <select
                      value={xCol}
                      onChange={e => setXCol(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Secondary Y Column */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">Y-Axis:</span>
                    <select
                      value={yCol}
                      onChange={e => setYCol(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-3 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-200">
                  Category: {activeChart.category}
                </span>
              </div>

              {/* Live Render Area */}
              <div className="flex-1 min-h-[400px] mt-4">
                <UniversalChartEngine
                  chartId={activeChart.id}
                  dataset={dataset}
                  columns={columns}
                  xCol={xCol}
                  yCol={yCol}
                  analysisResult={analysisResult}
                />
              </div>
            </NordicCard>
          </div>
        </div>
      )}
    </div>
  );
}
