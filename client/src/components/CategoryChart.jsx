import { ArcElement, Chart, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

Chart.register(ArcElement, Tooltip);

const COLORS = ['#1a5fb4', '#e5a50a', '#2e7d32', '#c62828', '#9141ac', '#c64600', '#2190a4', '#777'];

// Doughnut chart of this month's expenses by category
export default function CategoryChart({ categories }) {
  return (
    <div className="box">
      <h3>Expenses by category</h3>
      {categories.length === 0 ? (
        <p>No expenses this month.</p>
      ) : (
        <Doughnut
          data={{
            labels: categories.map((c) => c._id),
            datasets: [{ data: categories.map((c) => c.total), backgroundColor: COLORS }],
          }}
        />
      )}
    </div>
  );
}
