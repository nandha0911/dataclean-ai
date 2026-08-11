/**
 * QualityDashboard — Nordic Light Radar Chart
 * Accepts real `scores` prop from QualityReport page.
 */
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const NORDIC_SAGE   = '#7C9082';
const NORDIC_DUSTY  = '#7A8B99';

const QualityDashboard = ({ scores = {} }) => {
  const current = [
    scores.completeness ?? 83,
    scores.consistency  ?? 71,
    scores.accuracy     ?? 68,
    scores.uniqueness   ?? 95,
    scores.validity     ?? 77,
    scores.integrity    ?? 52,
  ];
  // Estimate post-clean values (simple optimistic projection)
  const estimated = current.map(v => Math.min(100, v + (100 - v) * 0.65));

  const data = {
    labels: ['Completeness', 'Consistency', 'Accuracy', 'Uniqueness', 'Validity', 'Integrity'],
    datasets: [
      {
        label: 'Current',
        data: current,
        backgroundColor: `${NORDIC_SAGE}22`,
        borderColor: NORDIC_SAGE,
        borderWidth: 2,
        pointBackgroundColor: NORDIC_SAGE,
        pointBorderColor: '#fff',
        pointRadius: 4,
      },
      {
        label: 'After Cleaning (Est.)',
        data: estimated,
        backgroundColor: `${NORDIC_DUSTY}18`,
        borderColor: NORDIC_DUSTY,
        borderWidth: 2,
        borderDash: [6, 4],
        pointBackgroundColor: NORDIC_DUSTY,
        pointBorderColor: '#fff',
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        angleLines: { color: 'rgba(113,128,150,0.15)' },
        grid:        { color: 'rgba(113,128,150,0.15)' },
        pointLabels: {
          color: '#4A5568',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 12, weight: '600' },
        },
        ticks: {
          display: false,
          stepSize: 20,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#718096',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 12, weight: '600' },
          boxWidth: 12,
          padding: 20,
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
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(0)}%`,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
};

export default QualityDashboard;
