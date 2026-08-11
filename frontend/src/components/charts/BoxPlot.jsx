import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const BoxPlot = () => {
  // Simulating a box plot using a floating bar chart for simplicity in standard chart.js
  const data = {
    labels: ['Col_A', 'Col_B', 'Col_C', 'Col_D'],
    datasets: [
      {
        label: 'IQR Range',
        data: [
          [20, 60],
          [40, 80],
          [10, 90],
          [30, 50]
        ],
        backgroundColor: 'rgba(0, 255, 255, 0.5)',
        borderColor: '#00FFFF',
        borderWidth: 2,
        barPercentage: 0.5
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0A0A0A',
        titleColor: '#00FFFF',
        bodyColor: '#00FFFF',
        borderColor: '#00FFFF',
        borderWidth: 1,
        bodyFont: { family: '"VT323", monospace', size: 16 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0, 255, 255, 0.1)' },
        ticks: { color: '#00FFFF', font: { family: '"VT323", monospace', size: 14 } }
      },
      y: {
        grid: { color: 'rgba(0, 255, 255, 0.1)' },
        ticks: { color: '#00FFFF', font: { family: '"VT323", monospace', size: 14 } }
      }
    }
  };

  return <Bar data={data} options={options} />;
};

export default BoxPlot;
