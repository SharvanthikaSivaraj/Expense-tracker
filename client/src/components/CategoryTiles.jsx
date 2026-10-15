import { categoryMeta, formatMoney } from '../constants';
import EmptyState from './EmptyState';
import Icon from './Icon';

export default function CategoryTiles({ byCategory, expense }) {
  return (
    <section className="panel blue">
      <h2>Spending map</h2>
      {byCategory.length === 0 ? (
        <EmptyState small icon="chart" text="No expenses this month." />
      ) : (
        <div className="bubbles">
          {byCategory.map((c) => {
            const pct = expense ? (c.total / expense) * 100 : 0;
            const size = Math.round(96 + (pct / 100) * 170);
            return (
              <div
                key={c._id}
                className="bubble"
                style={{ '--size': `${size}px`, '--p': pct.toFixed(1) }}
                title={`${c._id}: ${formatMoney(c.total)}`}
              >
                <span className="bubble-icon"><Icon name={categoryMeta(c._id).icon} size={22} /></span>
                <small>{c._id}</small>
                <strong>{pct.toFixed(1)}%</strong>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
