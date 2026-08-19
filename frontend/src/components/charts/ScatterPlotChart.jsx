/**
 * ScatterPlotChart — Interactive X vs Y Scatter Plot with Trend Points
 */
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

export default function ScatterPlotChart({ points = [], xCol = 'Feature X', yCol = 'Feature Y' }) {
  if (!points || !points.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 text-xs font-medium py-10">
        No bivariate numeric data points available for {xCol} vs {yCol}
      </div>
    );
  }

  const chartData = {
    datasets: [
      {
        label: `${xCol} vs ${yCol}`,
        data: points,
        backgroundColor: 'rgba(124, 144, 130, 0.65)',
        borderColor: '#7C9082',
        borderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: xCol,
          color: '#718096',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 12, weight: '700' },
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { color: '#718096', font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 } },
      },
      y: {
        title: {
          display: true,
          text: yCol,
          color: '#718096',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 12, weight: '700' },
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' },
        ticks: { color: '#718096', font: { family: '"Plus Jakarta Sans", sans-serif', size: 11 } },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#FFFFFF',
        titleColor: '#2D3748',
        bodyColor: '#718096',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => ` (${xCol}: ${ctx.raw.x}, ${yCol}: ${ctx.raw.y})`,
        },
      },
    },
  };

  return <Scatter data={chartData} options={options} />;
}
