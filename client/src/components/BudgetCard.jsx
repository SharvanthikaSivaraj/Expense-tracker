import { formatMoney } from '../constants';
import EmptyState from './EmptyState';

const R = 44;
const C = 2 * Math.PI * R;

export default function BudgetCard({ expense, budget, onSetup }) {
  if (!budget) {
    return (
      <section className="panel budget">
        <h2>Monthly budget</h2>
        <EmptyState
          small
          icon="target"
          text="Set a monthly limit and track how much you have left."
          action={<button type="button" className="btn primary" onClick={onSetup}>Set budget</button>}
        />
      </section>
    );
  }

  const ratio = expense / budget;
  const pct = Math.round(ratio * 100);
  const state = ratio > 1 ? 'over' : ratio >= 0.75 ? 'warn' : 'ok';
  const left = budget - expense;

  return (
    <section className="panel budget">
      <h2>Monthly budget</h2>
      <div className="budget-body">
        <div className={`ring ${state}`}>
          <svg viewBox="0 0 100 100" width="96" height="96" role="img" aria-label={`${pct}% of budget used`}>
            <circle cx="50" cy="50" r={R} className="ring-track" />
            <circle
              cx="50"
              cy="50"
              r={R}
              className="ring-fill"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - Math.min(1, ratio))}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <span className="ring-text">{pct}%</span>
        </div>
        <div className="budget-info">
          <strong className={state === 'over' ? 'bad' : ''}>
            {left >= 0 ? `${formatMoney(left)} left` : `Over by ${formatMoney(-left)}`}
          </strong>
          <span className="muted">
            {formatMoney(expense)} of {formatMoney(budget)}
          </span>
          <span className={`budget-note ${state}`}>
            {state === 'over' ? 'Budget exceeded' : state === 'warn' ? 'Close to the limit' : 'On track'}
          </span>
        </div>
      </div>
    </section>
  );
}
