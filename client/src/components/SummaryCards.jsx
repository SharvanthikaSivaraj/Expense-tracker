import { formatMoney } from '../constants';

export default function SummaryCards({ summary }) {
  const { income, expense, balance } = summary;

  return (
    <section className="summary">
      <div className="panel">
        <small>Income</small>
        <strong className="income">{formatMoney(income)}</strong>
      </div>
      <div className="panel">
        <small>Expense</small>
        <strong className="expense">{formatMoney(expense)}</strong>
      </div>
      <div className="panel">
        <small>Balance</small>
        <strong>{formatMoney(balance)}</strong>
      </div>
    </section>
  );
}
