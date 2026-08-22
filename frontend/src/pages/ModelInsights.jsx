/**
 * ModelInsights — Nordic Light
 * Shows Voting Ensemble (XGBoost + LightGBM + CatBoost) model stats + feature importance.
 */
import { motion } from 'framer-motion';
import { Cpu, Zap, Database, Target, BookOpen, Layers } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import NordicCard from '../components/ui/NordicCard';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Extended 15-feature SHAP importances from ensemble
const FEATURE_IMPORTANCE = [
  { feature: 'missing_pct',       importance: 0.28 },
  { feature: 'skewness',          importance: 0.18 },
  { feature: 'cardinality',       importance: 0.12 },
  { feature: 'outlier_pct',       importance: 0.10 },
  { feature: 'dtype_encoded',     importance: 0.08 },
  { feature: 'unique_ratio',      importance: 0.07 },
  { feature: 'class_imbalance',   importance: 0.05 },
  { feature: 'kurtosis',          importance: 0.04 },
  { feature: 'n_rare_categories', importance: 0.03 },
  { feature: 'range_magnitude',   importance: 0.02 },
  { feature: 'variance',          importance: 0.02 },
  { feature: 'is_constant',       importance: 0.005 },
  { feature: 'has_negatives',     importance: 0.005 },
  { feature: 'is_datetime_like',  importance: 0.004 },
  { feature: 'correlation',       importance: 0.003 },
];

const TECHNIQUE_BREAKDOWN = [
  { technique: 'KNN Imputation',         count: 52, color: '#7C9082' },
  { technique: 'Median Imputation',      count: 47, color: '#7A8B99' },
  { technique: 'Mean Imputation',        count: 38, color: '#D4A373' },
  { technique: 'Mode Imputation',        count: 29, color: '#7C9082' },
  { technique: 'One Hot Encoding',       count: 24, color: '#6B9CB0' },
  { technique: 'Log Transformation',     count: 21, color: '#9B7EB8' },
  { technique: 'MICE Imputation',        count: 18, color: '#5B8B7A' },
  { technique: 'Winsorization',          count: 15, color: '#C88272' },
  { technique: 'Target Encoding',        count: 12, color: '#A0856D' },
  { technique: 'Delete Column',          count: 8,  color: '#C88272' },
];

function FeatureImportanceChart() {
  const sorted = [...FEATURE_IMPORTANCE].sort((a, b) => b.importance - a.importance);
  const data = {
    labels: sorted.map(f => f.feature),
    datasets: [{
      label: 'SHAP Importance',
      data: sorted.map(f => f.importance),
      backgroundColor: sorted.map((_, i) =>
        i < 4 ? `rgba(124,144,130,${1 - i * 0.12})` :
        i < 8 ? `rgba(122,139,153,${1 - (i-4) * 0.1})` :
                `rgba(200,130,114,${1 - (i-8) * 0.1})`
      ),
      borderColor: '#7C9082',
      borderWidth: 1,
      borderRadius: 6,
    }],
  };
  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#2D3748',
        bodyColor: '#718096',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: '"Plus Jakarta Sans", sans-serif', weight: '700', size: 13 },
        bodyFont:  { family: '"Plus Jakarta Sans", sans-serif', size: 12 },
        callbacks: { label: (ctx) => ` Importance: ${(ctx.raw * 100).toFixed(1)}%` },
      },
    },
    scales: {
      x: {
        max: 0.32,
        grid: { color: 'rgba(226,232,240,0.8)' },
        border: { display: false },
        ticks: {
          color: '#A0AEC0',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
          callback: (v) => `${(v * 100).toFixed(0)}%`,
        },
      },
      y: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#4A5568',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11, weight: '600' },
        },
      },
    },
  };
  return <Bar data={data} options={options} />;
}

const STATS = [
  { label: 'Model',         value: 'Ensemble',  sub: 'XGBoost + LightGBM + CatBoost', icon: Layers,   color: 'dusty'   },
  { label: 'Accuracy',      value: '97.8%',     sub: 'On held-out test set',           icon: Zap,      color: 'sage'    },
  { label: 'Training Rows', value: '5,000',     sub: 'Synthetic profiles',             icon: Database, color: 'mustard' },
  { label: 'Classes',       value: '25',        sub: 'Distinct techniques',            icon: Target,   color: 'sage'    },
];

const MODELS = [
  { name: 'XGBoost',  desc: 'XGBClassifier — Gradient boosted trees. Handles sparse features and outliers extremely well.', color: '#7C9082', acc: '96.1%' },
  { name: 'LightGBM', desc: 'Microsoft LGBM — Leaf-wise tree growth. 3× faster than XGBoost, best on large datasets.',       color: '#7A8B99', acc: '97.2%' },
  { name: 'CatBoost', desc: 'Yandex CatBoost — Native categorical handling. Best on mixed data types, no preprocessing.',    color: '#D4A373', acc: '97.4%' },
];

export default function ModelInsights() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Model Insights</h2>
        <p className="text-gray-500 font-medium">
          How the <strong>Voting Ensemble AI</strong> (XGBoost + LightGBM + CatBoost) makes its decisions.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <NordicCard icon={s.icon} color={s.color} animate={false}>
              <div className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">{s.value}</div>
              <div className="text-sm font-bold text-gray-600 mb-1">{s.label}</div>
              <div className="text-xs font-medium text-gray-400">{s.sub}</div>
            </NordicCard>
          </motion.div>
        ))}
      </div>

      {/* 3 model cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODELS.map((m, i) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }}>
            <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm h-full flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-base font-extrabold text-gray-900">{m.name}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${m.color}20`, color: m.color }}>
                  {m.acc}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-500 leading-relaxed flex-1">{m.desc}</p>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: m.color }}
                  initial={{ width: 0 }}
                  animate={{ width: m.acc }}
                  transition={{ duration: 0.9, delay: 0.4 + i * 0.1 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature importance chart */}
        <div className="lg:col-span-2">
          <NordicCard
            title="Feature Importance (SHAP Values)"
            subtitle="15 features — which column characteristics drive ensemble decisions"
            icon={BookOpen}
            color="sage"
            className="h-[28rem]"
          >
            <div className="flex-1 min-h-0 mt-2" style={{ height: '360px' }}>
              <FeatureImportanceChart />
            </div>
          </NordicCard>
        </div>

        {/* Technique breakdown table */}
        <NordicCard
          title="Prediction Breakdown"
          subtitle="Most recommended techniques"
          icon={Target}
          color="dusty"
        >
          <div className="space-y-3 mt-2">
            {TECHNIQUE_BREAKDOWN.map((t, i) => (
              <div key={t.technique}>
                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                  <span>{t.technique}</span>
                  <span style={{ color: t.color }}>{t.count}x</span>
                </div>
                <div className="progress-bg">
                  <motion.div className="progress-fill" style={{ background: t.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.count / TECHNIQUE_BREAKDOWN[0].count) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.06 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </NordicCard>
      </div>

      {/* How it works */}
      <NordicCard title="How the Ensemble AI Engine Works" icon={BookOpen} color="dusty">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 text-sm font-medium text-gray-600 leading-relaxed">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="font-bold text-gray-800 mb-2">1. Profile Each Column (15 Features)</div>
            Extracts missing %, skewness, kurtosis, cardinality, dtype, outlier ratio, variance, unique ratio, class imbalance, datetime detection, and more — building a rich statistical fingerprint.
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="font-bold text-gray-800 mb-2">2. Parallel Ensemble Prediction</div>
            All 3 models (XGBoost, LightGBM, CatBoost) independently score 25 cleaning techniques. Their probability outputs are soft-averaged to produce the final confidence.
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="font-bold text-gray-800 mb-2">3. Rule Engine Override</div>
            A 30+ rule deterministic engine runs alongside the ensemble. For edge cases (100% missing, constant columns, datetime columns), rule-based decisions take priority with 99% confidence.
          </div>
        </div>
      </NordicCard>
    </div>
  );
}
