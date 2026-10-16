import { useState } from 'react';
import { PAYMENT_METHODS, dayLabel, formatMoney, toInputDate } from '../constants';
import EmptyState from './EmptyState';

const methodLabel = (v) => PAYMENT_METHODS.find((m) => m.value === v)?.label || v;

export default function TransactionList({ transactions, loading, onEdit, onDelete, onAdd, compact = false, limit = 7, onSeeAll }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const list = (compact ? transactions.slice(0, limit) : transactions).filter(
    (t) =>
      (filter === 'all' || t.type === filter) &&
      (!q || [t.category, t.note || ''].some((s) => s.toLowerCase().includes(q)))
  );

  return (
    <section className="panel">
      <div className="list-head">
        <h2>{compact ? 'Recent transactions' : `Transactions (${list.length})`}</h2>
        {compact && transactions.length > 0 && (
          <button type="button" className="link" onClick={onSeeAll}>See all</button>
        )}
      </div>

      {!compact && transactions.length > 0 && (
        <div className="controls">
          <input
            type="search"
            placeholder="Search category or note"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by type">
            <option value="all">All</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading...</p>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          text="Add your first transaction for this month."
          action={<button type="button" className="btn primary" onClick={() => onAdd()}>Add transaction</button>}
        />
      ) : list.length === 0 ? (
        <p className="muted">No transactions match.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Paid with</th>
              <th>Note</th>
              <th className="right">Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t._id}>
                <td>{dayLabel(toInputDate(t.date))}</td>
                <td>{t.category}</td>
                <td>{methodLabel(t.paymentMethod)}</td>
                <td className="muted">{t.note}</td>
                <td className={`right ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}
                  {formatMoney(t.amount)}
                </td>
                <td className="right">
                  <button type="button" className="link" onClick={() => onEdit(t)}>Edit</button>{' '}
                  <button type="button" className="link danger" onClick={() => onDelete(t)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
