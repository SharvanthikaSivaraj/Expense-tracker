import { formatMoney } from '../constants';

export default function SummaryCards({ summary }) {
  const { income, expense, balance } = summary;
  return (
    <section className="cards">
      <div className="card income">
        <span className="card-label">Income</span>
        <strong>{formatMoney(income)}</strong>
      </div>
      <div className="card expense">
        <span className="card-label">Expense</span>
        <strong>{formatMoney(expense)}</strong>
      </div>
      <div className={`card balance ${balance < 0 ? 'negative' : ''}`}>
        <span className="card-label">Balance</span>
        <strong>{formatMoney(balance)}</strong>
      </div>
    </section>
  );
}
