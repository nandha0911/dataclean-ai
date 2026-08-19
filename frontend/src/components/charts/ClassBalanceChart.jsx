/**
 * ClassBalanceChart — Categorical Distribution Doughnut Chart
 */
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const NORDIC_PALETTE = [
  '#7C9082', '#7A8B99', '#D4A373', '#C88272', '#9AAD9F',
  '#A3B18A', '#588157', '#E07A5F', '#3D405B', '#81B29A',
  '#F2CC8F', '#6B705C', '#CB997E', '#DDBEA9', '#FFE8D6'
];

export default function ClassBalanceChart({ data, column }) {
  if (!data || !data.labels || !data.labels.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs font-medium py-10">
        No categorical class data available for {column || 'this column'}
      </div>
    );
  }

  const chartData = {
    labels: data.labels.map(String),
    datasets: [
      {
        data: data.counts || data.values || [],
        backgroundColor: NORDIC_PALETTE.slice(0, data.labels.length),
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#4A5568',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11, weight: '600' },
          boxWidth: 12,
          padding: 12,
        },
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#2D3748',
        bodyColor: '#718096',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const val = ctx.raw;
            const pct = total ? ((val / total) * 100).toFixed(1) : 0;
            return ` Count: ${val} (${pct}%)`;
          },
        },
      },
    },
    cutout: '65%',
  };

  return <Doughnut data={chartData} options={options} />;
}
