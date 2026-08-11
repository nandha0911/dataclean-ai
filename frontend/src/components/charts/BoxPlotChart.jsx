/**
 * BoxPlotChart — Nordic Light
 * Displays outlier count per column as a horizontal bar chart.
 * Accepts `data` prop: [{ column, outliers_iqr, outliers_zscore }]
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const DEMO = [
  { column: 'salary',      outliers_iqr: 12, outliers_zscore: 8  },
  { column: 'age',         outliers_iqr: 3,  outliers_zscore: 2  },
  { column: 'bonus',       outliers_iqr: 22, outliers_zscore: 18 },
  { column: 'tenure',      outliers_iqr: 0,  outliers_zscore: 1  },
  { column: 'performance', outliers_iqr: 5,  outliers_zscore: 4  },
];

const BoxPlotChart = ({ data = DEMO }) => {
  const sorted = [...data].sort((a, b) => (b.outliers_iqr ?? 0) - (a.outliers_iqr ?? 0));

  const chartData = {
    labels: sorted.map(d => d.column),
    datasets: [
      {
        label: 'IQR Outliers',
        data: sorted.map(d => d.outliers_iqr ?? 0),
        backgroundColor: 'rgba(200,130,114,0.65)',
        borderColor: '#C88272',
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Z-Score Outliers',
        data: sorted.map(d => d.outliers_zscore ?? 0),
        backgroundColor: 'rgba(212,163,115,0.65)',
        borderColor: '#D4A373',
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
      legend: {
        position: 'bottom',
        labels: {
          color: '#718096',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 12, weight: '600' },
          boxWidth: 10,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#2D3748',
        bodyColor: '#718096',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 12,
        titleFont: { family: '"Plus Jakarta Sans", sans-serif', weight: '700', size: 13 },
        bodyFont:  { family: '"Plus Jakarta Sans", sans-serif', size: 12 },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(226,232,240,0.8)' },
        border: { display: false },
        ticks: {
          color: '#A0AEC0',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
          callback: (v) => `${v} pts`,
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

  return <Bar data={chartData} options={options} />;
};

export default BoxPlotChart;
