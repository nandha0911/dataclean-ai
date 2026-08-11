/**
 * DistributionPlot — Nordic Light Histogram
 * Accepts `column`, `labels` (bin edges), `values` (frequencies) props.
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

// Generate demo bell-curve like distribution
const DEMO_LABELS = Array.from({ length: 20 }, (_, i) => (i * 5).toString());
const DEMO_VALUES = DEMO_LABELS.map((_, i) => {
  const x = (i - 10) / 3;
  return Math.round(Math.exp(-0.5 * x * x) * 80 + Math.random() * 8);
});

const DistributionPlot = ({
  column = 'salary',
  labels = DEMO_LABELS,
  values = DEMO_VALUES,
}) => {
  const chartData = {
    labels,
    datasets: [
      {
        label: `Distribution — ${column}`,
        data: values,
        backgroundColor: 'rgba(124,144,130,0.55)',
        borderColor: '#7C9082',
        borderWidth: 1.5,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(124,144,130,0.8)',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
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
        callbacks: {
          label: (ctx) => ` Frequency: ${ctx.raw}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#A0AEC0',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
          maxRotation: 0,
          maxTicksLimit: 10,
        },
      },
      y: {
        grid: { color: 'rgba(226,232,240,0.8)' },
        border: { display: false },
        ticks: {
          color: '#A0AEC0',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default DistributionPlot;
