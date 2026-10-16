import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { categoryMeta, formatCompact, formatMoney } from '../constants';
import EmptyState from './EmptyState';
import Icon from './Icon';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);

const money = (ctx) => ` ${formatMoney(ctx.parsed.y ?? ctx.parsed)}`;

export function CategoryDonut({ summary, dark }) {
  const { expense, byCategory } = summary;
  const surface = dark ? '#121c19' : '#ffffff';

  const data = {
    labels: byCategory.map((c) => c._id),
    datasets: [
      {
        data: byCategory.map((c) => c.total),
        backgroundColor: byCategory.map((c) => categoryMeta(c._id).color),
        borderColor: surface,
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  return (
    <section className="panel">
      <h2>Where it went</h2>
      {byCategory.length === 0 ? (
        <EmptyState small icon="chart" text="No expenses this month." />
      ) : (
        <>
          <div className="donut">
            <Doughnut
              data={data}
              options={{
                maintainAspectRatio: false,
                cutout: '74%',
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
                  <span className="legend-icon" style={{ background: `${meta.color}26`, color: meta.color }}>
                    <Icon name={meta.icon} size={16} />
                  </span>
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

export function IncomeExpenseBar({ summary, dark }) {
  const { income, expense } = summary;
  const textColor = dark ? '#88a198' : '#5d716a';
  const gridColor = dark ? '#23332d' : '#dce7e2';

  const data = {
    labels: ['Income', 'Expense'],
    datasets: [
      {
        data: [income, expense],
        backgroundColor: [dark ? '#6ee7a8' : '#17834f', dark ? '#ff8f8f' : '#d2433b'],
        borderRadius: 10,
        maxBarThickness: 84,
      },
    ],
  };

  return (
    <section className="panel">
      <h2>Income vs expense</h2>
      {income === 0 && expense === 0 ? (
        <EmptyState small icon="chart" text="No data this month." />
      ) : (
        <div className="bar-box">
          <Bar
            data={data}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { callbacks: { label: money } } },
              scales: {
                x: { grid: { display: false }, border: { display: false }, ticks: { color: textColor } },
                y: {
                  beginAtZero: true,
                  border: { display: false },
                  grid: { color: gridColor },
                  ticks: { color: textColor, callback: (v) => formatCompact(v), maxTicksLimit: 5 },
                },
              },
            }}
          />
        </div>
      )}
    </section>
  );
}
