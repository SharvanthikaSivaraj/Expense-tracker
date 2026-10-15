import { useMemo, useState } from 'react';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { daysInMonth, formatCompact, formatMoney, toInputDate } from '../constants';
import EmptyState from './EmptyState';

ChartJS.register(BarElement, CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);

export default function DailyChart({ transactions, month, budget, dark }) {
  const [mode, setMode] = useState('bar');
  const textColor = dark ? '#88a198' : '#5d716a';
  const gridColor = dark ? '#23332d' : '#dce7e2';
  const expenseColor = dark ? '#ff8f8f' : '#d2433b';
  const incomeColor = dark ? '#6ee7a8' : '#17834f';

  const { labels, expense, income, cumulative } = useMemo(() => {
    const n = daysInMonth(month);
    const exp = Array(n).fill(0);
    const inc = Array(n).fill(0);
    for (const t of transactions) {
      const d = Number(toInputDate(t.date).slice(8));
      if (d >= 1 && d <= n) (t.type === 'expense' ? exp : inc)[d - 1] += t.amount;
    }
    const cumulative = exp.reduce((acc, v, i) => [...acc, (acc[i - 1] ?? 0) + v], []);
    return {
      labels: Array.from({ length: n }, (_, i) => String(i + 1)),
      expense: exp,
      income: inc,
      cumulative,
    };
  }, [transactions, month]);

  const hasData = expense.some(Boolean) || income.some(Boolean);

  const scales = {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: textColor, maxTicksLimit: 10 } },
    y: {
      beginAtZero: true,
      border: { display: false },
      grid: { color: gridColor },
      ticks: { color: textColor, callback: (v) => formatCompact(v), maxTicksLimit: 5 },
    },
  };
  const tooltip = {
    callbacks: {
      title: (items) => `Day ${items[0].label}`,
      label: (ctx) => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}`,
    },
  };

  const lineDatasets = [
    {
      label: 'Spent so far',
      data: cumulative,
      borderColor: expenseColor,
      backgroundColor: `${expenseColor}22`,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 5,
    },
  ];
  if (budget > 0) {
    lineDatasets.push({
      label: 'Budget',
      data: Array(labels.length).fill(budget),
      borderColor: dark ? '#fbbf24' : '#d97706',
      borderDash: [6, 6],
      pointRadius: 0,
      fill: false,
    });
  }

  return (
    <section className="panel">
      <div className="list-head">
        <h2>Daily activity</h2>
        <div className="seg" role="group" aria-label="Chart type">
          {[
            ['bar', 'Bar'],
            ['line', 'Cumulative'],
          ].map(([id, label]) => (
            <button key={id} type="button" className={mode === id ? 'on' : ''} aria-pressed={mode === id} onClick={() => setMode(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <EmptyState small icon="chart" text="No activity this month." />
      ) : (
        <div className="bar-box tall">
          {mode === 'bar' ? (
            <Bar
              data={{
                labels,
                datasets: [
                  { label: 'Expense', data: expense, backgroundColor: expenseColor, borderRadius: 5, maxBarThickness: 14 },
                  { label: 'Income', data: income, backgroundColor: incomeColor, borderRadius: 5, maxBarThickness: 14 },
                ],
              }}
              options={{ maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip }, scales }}
            />
          ) : (
            <Line
              data={{ labels, datasets: lineDatasets }}
              options={{
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false }, tooltip },
                scales,
              }}
            />
          )}
        </div>
      )}
    </section>
  );
}
