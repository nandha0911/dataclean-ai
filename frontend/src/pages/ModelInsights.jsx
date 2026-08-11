/**
 * ModelInsights — Nordic Light
 * Shows XGBoost model stats + feature importance horizontal bar chart.
 */
import { motion } from 'framer-motion';
import { Cpu, Zap, Database, Target, BookOpen } from 'lucide-react';
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

// Simulated SHAP feature importances for demo
const FEATURE_IMPORTANCE = [
  { feature: 'missing_pct',    importance: 0.31 },
  { feature: 'skewness',       importance: 0.22 },
  { feature: 'cardinality',    importance: 0.14 },
  { feature: 'outlier_pct',    importance: 0.11 },
  { feature: 'dtype_encoded',  importance: 0.09 },
  { feature: 'kurtosis',       importance: 0.07 },
  { feature: 'variance',       importance: 0.04 },
  { feature: 'correlation',    importance: 0.02 },
];

const TECHNIQUE_BREAKDOWN = [
  { technique: 'KNN Imputation',      count: 42, color: '#7C9082'  },
  { technique: 'Median Imputation',   count: 38, color: '#7A8B99'  },
  { technique: 'Mean Imputation',     count: 29, color: '#D4A373'  },
  { technique: 'Mode Imputation',     count: 21, color: '#7C9082'  },
  { technique: 'Winsorization',       count: 17, color: '#C88272'  },
  { technique: 'Delete Column',       count: 8,  color: '#C88272'  },
];

function FeatureImportanceChart() {
  const sorted = [...FEATURE_IMPORTANCE].sort((a, b) => b.importance - a.importance);
  const data = {
    labels: sorted.map(f => f.feature),
    datasets: [{
      label: 'SHAP Importance',
      data: sorted.map(f => f.importance),
      backgroundColor: sorted.map((_, i) =>
        `rgba(124,144,130,${1 - i * 0.1})`
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
        max: 0.35,
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
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 12, weight: '600' },
        },
      },
    },
  };
  return <Bar data={data} options={options} />;
}

const STATS = [
  { label: 'Model',          value: 'XGBoost',  sub: 'XGBClassifier v1.7',  icon: Cpu,      color: 'dusty'   },
  { label: 'Accuracy',       value: '94.2%',    sub: 'On held-out test set', icon: Zap,      color: 'sage'    },
  { label: 'Training Rows',  value: '1,248',    sub: 'Synthetic profiles',   icon: Database, color: 'mustard' },
  { label: 'Classes',        value: '15',       sub: 'Distinct techniques',  icon: Target,   color: 'sage'    },
];

export default function ModelInsights() {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Model Insights</h2>
        <p className="text-gray-500 font-medium">
          How the XGBoost AI recommendation engine makes its decisions.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature importance chart */}
        <div className="lg:col-span-2">
          <NordicCard
            title="Feature Importance (SHAP Values)"
            subtitle="Which column characteristics drive recommendation decisions"
            icon={BookOpen}
            color="sage"
            className="h-96"
          >
            <div className="flex-1 min-h-0 mt-2">
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
          <div className="space-y-4 mt-2">
            {TECHNIQUE_BREAKDOWN.map((t, i) => (
              <div key={t.technique}>
                <div className="flex justify-between text-sm font-semibold text-gray-700 mb-1.5">
                  <span>{t.technique}</span>
                  <span style={{ color: t.color }}>{t.count}x</span>
                </div>
                <div className="progress-bg">
                  <motion.div className="progress-fill" style={{ background: t.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.count / TECHNIQUE_BREAKDOWN[0].count) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </NordicCard>
      </div>

      {/* How it works */}
      <NordicCard title="How the AI Engine Works" icon={BookOpen} color="dusty">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 text-sm font-medium text-gray-600 leading-relaxed">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="font-bold text-gray-800 mb-2">1. Profile Each Column</div>
            The engine extracts 8 statistical features per column: missing percentage, skewness, kurtosis, cardinality, data type, outlier ratio, variance, and correlation to neighbours.
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="font-bold text-gray-800 mb-2">2. Run Rule Engine</div>
            A deterministic rule engine applies 20+ expert heuristics to map column profiles to known cleaning techniques with base confidence scores.
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl">
            <div className="font-bold text-gray-800 mb-2">3. XGBoost Refinement</div>
            The XGBoost model, trained on 1,248 synthetic column profiles, refines the confidence score and may override the rule engine for ambiguous cases.
          </div>
        </div>
      </NordicCard>
    </div>
  );
}
