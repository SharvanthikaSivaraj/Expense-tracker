import { categoryMeta, formatMoney, formatDate } from '../constants';
import CategoryTiles from '../components/CategoryTiles';
import { IncomeExpenseBar } from '../components/Charts';
import DailyChart from '../components/DailyChart';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';

export default function Insights({ summary, transactions, month, budget, dark }) {
  const top = transactions
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return (
    <div className="insights">
      <div className="span-2">
        <DailyChart transactions={transactions} month={month} budget={budget} dark={dark} />
      </div>
      <CategoryTiles byCategory={summary.byCategory} expense={summary.expense} />
      <IncomeExpenseBar summary={summary} dark={dark} />
      <section className="panel span-2">
        <h2>Biggest expenses</h2>
        {top.length === 0 ? (
          <EmptyState small icon="list" text="No expenses this month." />
        ) : (
          <ol className="podium">
            {top.map((t, i) => {
              const meta = categoryMeta(t.category);
              return (
                <li key={t._id}>
                  <span className="rank">{i + 1}</span>
                  <span className="row-icon" style={{ background: `${meta.color}26`, color: meta.color }}>
                    <Icon name={meta.icon} size={19} />
                  </span>
                  <div className="row-main">
                    <strong>{t.category}</strong>
                    <span className="row-sub">{formatDate(t.date)}{t.note ? ` · ${t.note}` : ''}</span>
                  </div>
                  <span className="row-amount expense">{formatMoney(t.amount)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
