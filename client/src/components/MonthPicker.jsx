import { monthLabel, shiftMonth } from '../constants';
import Icon from './Icon';

export default function MonthPicker({ month, onChange, loading }) {
  return (
    <div className="month-nav">
      <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
        <Icon name="chevL" size={18} />
      </button>
      <label className="month-label">
        <span>{monthLabel(month)}</span>
        {loading && <span className="spinner small" aria-label="Loading" />}
        <input
          type="month"
          value={month}
          aria-label="Choose month"
          onChange={(e) => e.target.value && onChange(e.target.value)}
        />
      </label>
      <button type="button" className="icon-btn" aria-label="Next month" onClick={() => onChange(shiftMonth(month, 1))}>
        <Icon name="chevR" size={18} />
      </button>
    </div>
  );
}
