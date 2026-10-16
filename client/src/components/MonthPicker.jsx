import { monthLabel, shiftMonth } from '../constants';

export default function MonthPicker({ month, onChange, loading }) {
  return (
    <div className="month-nav">
      <button type="button" className="btn" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
        &lt;
      </button>
      <strong>{monthLabel(month)}</strong>
      <button type="button" className="btn" aria-label="Next month" onClick={() => onChange(shiftMonth(month, 1))}>
        &gt;
      </button>
      {loading && <span className="muted">Loading...</span>}
    </div>
  );
}
