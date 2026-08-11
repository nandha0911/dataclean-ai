/**
 * CorrelationMatrix — Nordic Light
 * Renders a correlation heatmap as a scatter matrix.
 * Accepts `data` prop: { columns: string[], matrix: number[][] }
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, Tooltip);

const DEMO = {
  columns: ['salary', 'age', 'bonus', 'tenure', 'score', 'rating'],
  matrix: [
    [ 1.00,  0.65,  0.80, -0.12,  0.30,  0.45],
    [ 0.65,  1.00,  0.20,  0.55, -0.10,  0.22],
    [ 0.80,  0.20,  1.00, -0.05,  0.40,  0.60],
    [-0.12,  0.55, -0.05,  1.00,  0.15,  0.08],
    [ 0.30, -0.10,  0.40,  0.15,  1.00,  0.70],
    [ 0.45,  0.22,  0.60,  0.08,  0.70,  1.00],
  ],
};

// Convert matrix to scatter points
function matrixToPoints(columns, matrix) {
  const points = [];
  for (let x = 0; x < columns.length; x++) {
    for (let y = 0; y < columns.length; y++) {
      points.push({ x, y, v: matrix[x][y], xLabel: columns[x], yLabel: columns[y] });
    }
  }
  return points;
}

// Interpolate between two hex colors by t (0..1)
function lerpColor(a, b, t) {
  const ah = parseInt(a.slice(1), 16);
  const bh = parseInt(b.slice(1), 16);
  const ar = (ah >> 16) & 0xff, ag = (ah >> 8) & 0xff, ab = ah & 0xff;
  const br = (bh >> 16) & 0xff, bg = (bh >> 8) & 0xff, bb = bh & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return `rgb(${rr},${rg},${rb})`;
}

const CorrelationMatrix = ({ data = DEMO }) => {
  const { columns, matrix } = data;
  const points = matrixToPoints(columns, matrix);
  const n = columns.length;

  const chartData = {
    datasets: [{
      data: points,
      backgroundColor: (ctx) => {
        const v = ctx.raw?.v ?? 0;
        if (v >= 0) return lerpColor('#F7F6F3', '#7C9082', v);   // sage for positive
        return lerpColor('#F7F6F3', '#C88272', Math.abs(v));       // terra for negative
      },
      pointStyle: 'rect',
      pointRadius: 22,
      pointHoverRadius: 24,
    }],
  };

  const options = {
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
          title: (items) => {
            const { xLabel, yLabel } = items[0].raw;
            return `${xLabel} × ${yLabel}`;
          },
          label: (ctx) => ` Correlation: ${ctx.raw.v.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        min: -0.5,
        max: n - 0.5,
        grid: { display: false },
        border: { display: false },
        ticks: {
          stepSize: 1,
          color: '#4A5568',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11, weight: '600' },
          callback: (v) => columns[v] ?? '',
        },
      },
      y: {
        type: 'linear',
        min: -0.5,
        max: n - 0.5,
        grid: { display: false },
        border: { display: false },
        ticks: {
          stepSize: 1,
          color: '#4A5568',
          font: { family: '"Plus Jakarta Sans", sans-serif', size: 11, weight: '600' },
          callback: (v) => columns[v] ?? '',
        },
      },
    },
  };

  return <Scatter data={chartData} options={options} />;
};

export default CorrelationMatrix;
