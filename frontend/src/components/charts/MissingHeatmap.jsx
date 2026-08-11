/**
 * MissingHeatmap — Nordic Light
 * Shows missing value % per column as a horizontal bar chart.
 * Accepts `data` prop: [{ column, missing_pct, missing_count }]
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DEMO_DATA = [
  { column: 'salary',       missing_pct: 15.3 },
  { column: 'department',   missing_pct: 8.2  },
  { column: 'manager_id',   missing_pct: 22.1 },
  { column: 'start_date',   missing_pct: 3.5  },
  { column: 'bonus',        missing_pct: 41.0 },
  { column: 'performance',  missing_pct: 0.8  },
];

const MissingHeatmap = ({ data = DEMO_DATA }) => {
  // Sort by missing_pct descending
  const sorted = [...data].sort((a, b) => b.missing_pct - a.missing_pct);

  const chartData = {
    labels: sorted.map(d => d.column),
    datasets: [
      {
        label: 'Missing %',
        data: sorted.map(d => parseFloat(d.missing_pct?.toFixed?.(1) ?? d.missing_pct)),
        backgroundColor: sorted.map(d =>
          d.missing_pct > 30 ? 'rgba(200,130,114,0.75)'   // terra — high
          : d.missing_pct > 10 ? 'rgba(212,163,115,0.75)' // mustard — medium
          : 'rgba(124,144,130,0.75)'                       // sage — low
        ),
        borderColor: sorted.map(d =>
          d.missing_pct > 30 ? '#C88272'
          : d.missing_pct > 10 ? '#D4A373'
          : '#7C9082'
        ),
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
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
        callbacks: {
          label: (ctx) => ` Missing: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(226,232,240,0.8)' },
        ticks: {
          color: '#A0AEC0',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
          callback: (v) => `${v}%`,
        },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#4A5568',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 12, weight: '600' },
        },
        border: { display: false },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default MissingHeatmap;
