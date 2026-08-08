/**
 * UIChart — Interactive Chart.js Initializer Module
 */

import { formatCurrency } from '../utils/currency.js';

const DATA_7D = {
  labels: ['02/05', '03/05', '04/05', '05/05', '06/05', '07/05', '08/05'],
  values: [15000000, 24000000, 21000000, 38000000, 31000000, 44000000, 52850000]
};

const DATA_30D = {
  labels: ['10/04', '13/04', '16/04', '19/04', '22/04', '25/04', '28/04', '01/05', '04/05', '08/05'],
  values: [18000000, 22000000, 29000000, 31000000, 26000000, 34000000, 40000000, 38000000, 45000000, 52850000]
};

export function initRevenueChart(canvasEl, timeframe = '7d') {
  if (!canvasEl || typeof Chart === 'undefined') return null;

  const ctx = canvasEl.getContext('2d');
  const dataset = timeframe === '30d' ? DATA_30D : DATA_7D;

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(0, 168, 204, 0.35)');
  gradient.addColorStop(1, 'rgba(0, 168, 204, 0.0)');

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataset.labels,
      datasets: [{
        label: 'Doanh thu',
        data: dataset.values,
        borderColor: '#00A8CC',
        borderWidth: 3.5,
        backgroundColor: gradient,
        fill: true,
        tension: 0.38,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#00A8CC',
        pointBorderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#00A8CC',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0B2C4D',
          titleColor: '#94A3B8',
          bodyColor: '#FFFFFF',
          titleFont: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
          bodyFont: { family: 'Plus Jakarta Sans', size: 12, weight: '800' },
          padding: 10,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            label: (context) => ` ${formatCurrency(context.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#64748B',
            font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
          }
        },
        y: {
          border: { dash: [4, 4] },
          grid: { color: '#F1F5F9' },
          ticks: {
            color: '#94A3B8',
            font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' },
            callback: (val) => `${val / 1000000}M`
          }
        }
      }
    }
  });
}

export function initTowerDonutChart(canvasEl, onHoverSegment = null) {
  if (!canvasEl || typeof Chart === 'undefined') return null;

  const ctx = canvasEl.getContext('2d');

  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Tháp A1 (45%)', 'Tháp A2 (36%)', 'Tháp A3 (15%)'],
      datasets: [{
        data: [120.96, 96.76, 40.32],
        backgroundColor: ['#0B2C4D', '#00A8CC', '#7CB342'],
        hoverBackgroundColor: ['#0A2540', '#0095B6', '#6FA338'],
        borderWidth: 3,
        borderColor: '#FFFFFF',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      onHover: (event, activeElements) => {
        if (onHoverSegment) {
          if (activeElements.length > 0) {
            const idx = activeElements[0].index;
            onHoverSegment(idx);
          } else {
            onHoverSegment(null);
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false // Floating tooltip box disabled so center text is never covered!
        }
      }
    }
  });
}
