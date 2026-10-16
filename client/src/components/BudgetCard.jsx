import { useState } from 'react';
import { formatMoney } from '../constants';

export default function BudgetCard({ expense, budget, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await onSave(Number(value) || 0);
      setEditing(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  const ratio = budget ? expense / budget : 0;
  const state = ratio > 1 ? 'over' : ratio >= 0.75 ? 'warn' : 'ok';
  const left = budget - expense;

  return (
    <section className="panel budget">
      <h2>Monthly budget</h2>

      {editing ? (
        <form className="form" onSubmit={submit}>
          <input
            className="text-input"
            type="number"
            min="0"
            placeholder="Monthly limit, e.g. 20000"
            aria-label="Monthly budget"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          {error && <div className="banner error" role="alert">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn" onClick={() => setEditing(false)}>Cancel</button>
            <button type="submit" className="btn primary">Save</button>
          </div>
        </form>
      ) : (
        <>
          {budget > 0 && (
            <>
              <strong className={state === 'over' ? 'bad' : ''}>
                {left >= 0 ? `${formatMoney(left)} left` : `Over by ${formatMoney(-left)}`}
              </strong>
              <div className="meter" role="img" aria-label={`${Math.round(ratio * 100)}% of budget used`}>
                <div className="meter-fill" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
              </div>
              <span className="muted">
                {formatMoney(expense)} of {formatMoney(budget)} spent
              </span>
            </>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => {
              setValue(budget ? String(budget) : '');
              setEditing(true);
            }}
          >
            {budget ? 'Change budget' : 'Set budget'}
          </button>
        </>
      )}
    </section>
  );
}
