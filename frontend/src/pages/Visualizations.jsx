/**
 * Visualizations Suite — 80-Chart Interactive Studio with Full Axis & Metric Customization
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, BarChart2, Grid, Sliders, ChevronRight,
  ArrowUpDown, Filter, Hash, Eye
} from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import UniversalChartEngine from '../components/charts/UniversalChartEngine';
import useAppStore from '../store/useAppStore';

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

  // Selected chart & catalog state
  const [activeChartId, setActiveChartId] = useState(1);
  const [activeCategory, setActiveCategory] = useState('All 80 Visualizations');
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardMode, setDashboardMode] = useState(false);

  // ── Axis Customization Controls ──
  const [xCol, setXCol] = useState('');
  const [yCol, setYCol] = useState('');
  const [aggregation, setAggregation] = useState('auto'); // auto | mean | sum | count | max | min | raw
  const [sortBy, setSortBy] = useState('y_desc');         // y_desc | y_asc | x_asc | x_desc | default
  const [itemLimit, setItemLimit] = useState(15);         // 5 | 10 | 15 | 25 | 50 | all
  const [scaleType, setScaleType] = useState('linear');   // linear | logarithmic

  // Extract columns
  const columns = useMemo(() => {
    return analysisResult?.columns?.map(c => c.column_name)
      || (currentDataset?.preview?.length ? Object.keys(currentDataset.preview[0]) : []);
  }, [analysisResult, currentDataset]);

  const dataset = useMemo(() => {
    return currentDataset?.cleanedPreview || currentDataset?.preview || [];
  }, [currentDataset]);

  // Set default columns on load
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
              80 Chart Types
            </span>
          </div>
          <p className="text-gray-500 font-medium mt-1">
            Customize axes, metrics, aggregations (Sum, Avg, Count, Max, Min), sorting, and scale.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDashboardMode(!dashboardMode)}
            className={`btn-nd text-xs flex items-center gap-1.5 ${
              dashboardMode ? 'bg-[#7C9082] text-white shadow-soft' : 'btn-nd-secondary'
            }`}
          >
            <Grid size={14} />
            {dashboardMode ? 'Focus Studio Mode' : '80-Chart Multi-Grid'}
          </button>
        </div>
      </div>

      {/* ── GLOBAL AXIS & METRIC CUSTOMIZATION BAR ── */}
      <div className="p-4 bg-white rounded-3xl shadow-soft border border-gray-100 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#7C9082] uppercase tracking-wider">
          <Sliders size={14} />
          <span>Customize Axes & Aggregations</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {/* 1. X-Axis Column */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500">X-Axis Column</label>
            <select
              value={xCol}
              onChange={e => setXCol(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer focus:border-[#7C9082]"
            >
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 2. Y-Axis Column */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500">Y-Axis Column</label>
            <select
              value={yCol}
              onChange={e => setYCol(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer focus:border-[#7C9082]"
            >
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* 3. Y-Metric / Aggregation */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500">Y-Axis Metric</label>
            <select
              value={aggregation}
              onChange={e => setAggregation(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-[#7C9082] outline-none cursor-pointer focus:border-[#7C9082]"
            >
              <option value="auto">Auto (Smart Metric)</option>
              <option value="mean">Average / Mean</option>
              <option value="sum">Sum / Total</option>
              <option value="count">Count / Frequency</option>
              <option value="max">Maximum Value</option>
              <option value="min">Minimum Value</option>
              <option value="raw">Raw Values (Per Row)</option>
            </select>
          </div>

          {/* 4. Sort By */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500">Sort Values</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer focus:border-[#7C9082]"
            >
              <option value="y_desc">Value: High → Low</option>
              <option value="y_asc">Value: Low → High</option>
              <option value="x_asc">X-Axis: A → Z / Min</option>
              <option value="x_desc">X-Axis: Z → A / Max</option>
              <option value="default">Original Order</option>
            </select>
          </div>

          {/* 5. Item Limit */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500">Items / Bars</label>
            <select
              value={itemLimit}
              onChange={e => setItemLimit(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer focus:border-[#7C9082]"
            >
              <option value={5}>Top 5 Items</option>
              <option value={10}>Top 10 Items</option>
              <option value={15}>Top 15 Items</option>
              <option value={25}>Top 25 Items</option>
              <option value={50}>Top 50 Items</option>
              <option value="all">All Items</option>
            </select>
          </div>

          {/* 6. Scale Type */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-gray-500">Scale Type</label>
            <select
              value={scaleType}
              onChange={e => setScaleType(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none cursor-pointer focus:border-[#7C9082]"
            >
              <option value="linear">Linear Scale</option>
              <option value="logarithmic">Logarithmic Scale</option>
            </select>
          </div>
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
                  aggregation={aggregation}
                  sortBy={sortBy}
                  itemLimit={itemLimit}
                  scaleType={scaleType}
                  analysisResult={analysisResult}
                />
              </div>
            </NordicCard>
          ))}
        </div>
      ) : (
        /* ── FOCUS STUDIO MODE: Deep-Dive Visualizer ── */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left: 80-Chart Selector List */}
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

          {/* Right: Active Live Chart View */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <NordicCard
              title={`${activeChart.id}. ${activeChart.name}`}
              subtitle={activeChart.desc}
              icon={BarChart2}
              color="sage"
              className="min-h-[540px]"
            >
              {/* Summary Pill Bar */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                    X-Axis: <strong className="text-gray-800">{xCol || 'None'}</strong>
                  </span>
                  <span className="px-3 py-1 bg-gray-50 rounded-full border border-gray-200">
                    Y-Axis: <strong className="text-gray-800">{yCol || 'None'}</strong> ({aggregation})
                  </span>
                </div>
                <span className="text-[10px] font-bold px-3 py-1 bg-[#F2F5F3] text-[#7C9082] rounded-full">
                  Category: {activeChart.category}
                </span>
              </div>

              {/* Live Render Area */}
              <div className="flex-1 min-h-[420px] mt-4">
                <UniversalChartEngine
                  chartId={activeChart.id}
                  dataset={dataset}
                  columns={columns}
                  xCol={xCol}
                  yCol={yCol}
                  aggregation={aggregation}
                  sortBy={sortBy}
                  itemLimit={itemLimit}
                  scaleType={scaleType}
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
