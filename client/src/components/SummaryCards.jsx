import { formatMoney } from '../constants';
import Icon from './Icon';

export default function SummaryCards({ summary, onAdd }) {
  const { income, expense, balance } = summary;

  return (
    <section className="summary">
      <div className="hero">
        <div className="hero-main">
          <span className="hero-label">Balance this month</span>
          <div className="hero-amount">{formatMoney(balance)}</div>
        </div>

        <div className="hero-flow">
          <div className="flow-item">
            <span className="flow-dot up"><Icon name="arrowDown" size={14} /></span>
            <div>
              <small>Income</small>
              <strong>{formatMoney(income)}</strong>
            </div>
          </div>
          <div className="flow-item">
            <span className="flow-dot down"><Icon name="arrowUp" size={14} /></span>
            <div>
              <small>Expense</small>
              <strong>{formatMoney(expense)}</strong>
            </div>
          </div>
        </div>

        <div className="hero-actions hero-wide">
          <button type="button" className="glass-btn" onClick={() => onAdd('income')}>
            <Icon name="arrowDown" size={16} /> Add income
          </button>
          <button type="button" className="glass-btn" onClick={() => onAdd('expense')}>
            <Icon name="arrowUp" size={16} /> Add expense
          </button>
        </div>
      </div>
    </section>
  );
}
