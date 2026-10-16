import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { categoryMeta, formatCompact, formatMoney } from '../constants';
import EmptyState from './EmptyState';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

const money = (ctx) => ` ${formatMoney(ctx.parsed.y ?? ctx.parsed)}`;

export function CategoryDonut({ summary }) {
  const { expense, byCategory } = summary;
  const data = {
    labels: byCategory.map((c) => c._id),
    datasets: [
      {
        data: byCategory.map((c) => c.total),
        backgroundColor: byCategory.map((c) => categoryMeta(c._id).color),
      },
    ],
  };

  return (
    <section className="panel">
      <h2>Where it went</h2>
      {byCategory.length === 0 ? (
        <EmptyState text="No expenses this month." />
      ) : (
        <>
          <div className="donut">
            <Doughnut
              data={data}
              options={{
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: money } } },
              }}
            />
            <div className="donut-center">
              <small>Spent</small>
              <strong>{formatMoney(expense)}</strong>
            </div>
          </div>
          <ul className="legend">
            {byCategory.map((c) => {
              const meta = categoryMeta(c._id);
              const pct = expense ? (c.total / expense) * 100 : 0;
              return (
                <li key={c._id}>
                  <span className="dot" style={{ background: meta.color }} />
                  <div className="legend-body">
                    <div className="legend-row">
                      <span>{c._id}</span>
                      <strong>{formatMoney(c.total)}</strong>
                    </div>
                    <div className="legend-bar">
                      <span style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export function IncomeExpenseBar({ summary }) {
  const { income, expense } = summary;

  const data = {
    labels: ['Income', 'Expense'],
    datasets: [
      {
        data: [income, expense],
        backgroundColor: ['#2e7d32', '#c62828'],
        maxBarThickness: 84,
      },
    ],
  };

  return (
    <section className="panel">
      <h2>Income vs expense</h2>
      {income === 0 && expense === 0 ? (
        <EmptyState text="No data this month." />
      ) : (
        <div className="bar-box">
          <Bar
            data={data}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: money } } },
              scales: {
                x: { grid: { display: false } },
                y: {
                  beginAtZero: true,
                  ticks: { callback: (v) => formatCompact(v), maxTicksLimit: 5 },
                },
              },
            }}
          />
        </div>
      )}
    </section>
  );
}
