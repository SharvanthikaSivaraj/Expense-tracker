import { useState } from 'react';
import { formatMoney } from '../constants';

export default function BudgetCard({ spent, budget, onSave }) {
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(false);

  async function submit(e) {
    e.preventDefault();
    await onSave(Number(value) || 0);
    setEditing(false);
  }

  return (
    <div className="box">
      <h3>Monthly budget</h3>
      {budget > 0 && (
        <>
          <progress value={Math.min(spent, budget)} max={budget} />
          <p>
            {formatMoney(spent)} of {formatMoney(budget)} spent
            {spent > budget && <span className="expense"> (over budget)</span>}
          </p>
        </>
      )}
      {editing ? (
        <form onSubmit={submit}>
          <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          <button>Save</button>
        </form>
      ) : (
        <button onClick={() => { setValue(budget || ''); setEditing(true); }}>
          {budget ? 'Change budget' : 'Set budget'}
        </button>
      )}
    </div>
  );
}
