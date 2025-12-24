// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Revenue Chart
  const revenueChartCanvas = document.getElementById('revenueChart');
  if (revenueChartCanvas && typeof revenueByDay !== 'undefined') {
    const ctx = revenueChartCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: revenueByDay.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: 'Revenue',
          data: revenueByDay.map(d => d.revenue),
          borderColor: '#0054a6',
          backgroundColor: 'rgba(0, 84, 166, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    });
  }
});
