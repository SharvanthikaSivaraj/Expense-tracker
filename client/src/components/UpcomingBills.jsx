import { categoryMeta, dueInfo, formatMoney } from '../constants';
import EmptyState from './EmptyState';
import Icon from './Icon';

export default function UpcomingBills({ reminders, onPay, onSeeAll }) {
  const upcoming = reminders.filter((r) => !r.paid).slice(0, 3);

  return (
    <section className="panel">
      <div className="list-head">
        <h2>Upcoming bills</h2>
        <button type="button" className="link-btn" onClick={onSeeAll}>
          See all <Icon name="chevR" size={16} />
        </button>
      </div>
      {upcoming.length === 0 ? (
        <EmptyState small icon="calendar" text="No bills coming up." />
      ) : (
        <ul className="bill-mini">
          {upcoming.map((r) => {
            const due = dueInfo(r.dueDate);
            const meta = categoryMeta(r.category);
            return (
              <li key={r._id}>
                <span className="row-icon" style={{ background: `${meta.color}26`, color: meta.color }}>
                  <Icon name={meta.icon} size={18} />
                </span>
                <div className="row-main">
                  <strong>{r.title}</strong>
                  <span className={`due-chip ${due.tone}`}>{due.label}</span>
                </div>
                <span className="bill-amount">{formatMoney(r.amount)}</span>
                <button type="button" className="btn small" onClick={() => onPay(r)}>Pay</button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
