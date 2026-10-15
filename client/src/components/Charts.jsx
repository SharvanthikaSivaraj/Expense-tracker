import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PALETTE = ['#2563eb', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#84cc16'];

export default function Charts({ summary }) {
  const { income, expense, byCategory } = summary;
  const hasData = income > 0 || expense > 0;

  const doughnut = {
    labels: byCategory.map((c) => c._id),
    datasets: [
      {
        data: byCategory.map((c) => c.total),
        backgroundColor: byCategory.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
      },
    ],
  };

  const bar = {
    labels: ['Income', 'Expense'],
    datasets: [{ data: [income, expense], backgroundColor: ['#16a34a', '#dc2626'], borderRadius: 6 }],
  };

  return (
    <section className="charts">
      <div className="panel">
        <h2>Expense by category</h2>
        {byCategory.length === 0 ? (
          <p className="muted">No expenses this month.</p>
        ) : (
          <div className="chart-box">
            <Doughnut data={doughnut} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        )}
      </div>
      <div className="panel">
        <h2>Income vs expense</h2>
        {!hasData ? (
          <p className="muted">No data this month.</p>
        ) : (
          <div className="chart-box">
            <Bar
              data={bar}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
