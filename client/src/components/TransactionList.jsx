import { useMemo, useState } from 'react';
import { categoryMeta, dayLabel, formatMoney, PAYMENT_METHODS, toInputDate } from '../constants';
import EmptyState from './EmptyState';
import Icon from './Icon';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'expense', label: 'Expenses' },
  { id: 'income', label: 'Income' },
];

const SORTS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'high', label: 'Highest amount' },
  { id: 'low', label: 'Lowest amount' },
];

const methodLabel = (v) => PAYMENT_METHODS.find((m) => m.value === v)?.label || v;

function groupByDay(items) {
  const byDay = new Map();
  for (const t of items) {
    const key = toInputDate(t.date);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key).push(t);
  }
  return [...byDay.entries()].map(([day, list]) => ({
    day,
    items: list,
    spent: list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }));
}

function Row({ t, onEdit, onDelete }) {
  const meta = categoryMeta(t.category);
  return (
    <li className="row">
      <span className="row-icon" style={{ background: `${meta.color}26`, color: meta.color }}>
        <Icon name={meta.icon} size={19} />
      </span>
      <div className="row-main">
        <strong>{t.category}</strong>
        <span className="row-sub">
          <span className="tag">{methodLabel(t.paymentMethod)}</span>
          {t.note && <span className="note">{t.note}</span>}
        </span>
      </div>
      <span className={`row-amount ${t.type}`}>
        {t.type === 'income' ? '+' : '−'}
        {formatMoney(t.amount)}
      </span>
      <span className="row-actions">
        <button type="button" className="icon-btn" aria-label={`Edit ${t.category}`} onClick={() => onEdit(t)}>
          <Icon name="edit" size={17} />
        </button>
        <button type="button" className="icon-btn danger" aria-label={`Delete ${t.category}`} onClick={() => onDelete(t)}>
          <Icon name="trash" size={17} />
        </button>
      </span>
    </li>
  );
}

export default function TransactionList({
  transactions,
  loading,
  onEdit,
  onDelete,
  onAdd,
  compact = false,
  limit = 6,
  onSeeAll,
}) {
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [query, setQuery] = useState('');

  const categories = useMemo(() => [...new Set(transactions.map((t) => t.category))].sort(), [transactions]);

  const { groups, flat } = useMemo(() => {
    if (compact) return { groups: groupByDay(transactions.slice(0, limit)), flat: null };

    const q = query.trim().toLowerCase();
    let list = transactions.filter(
      (t) =>
        (filter === 'all' || t.type === filter) &&
        (category === 'all' || t.category === category) &&
        (!q || [t.category, t.note || '', t.paymentMethod].some((s) => s.toLowerCase().includes(q)))
    );

    if (sort === 'oldest') list = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (sort === 'high') return { groups: null, flat: [...list].sort((a, b) => b.amount - a.amount) };
    if (sort === 'low') return { groups: null, flat: [...list].sort((a, b) => a.amount - b.amount) };
    return { groups: groupByDay(list), flat: null };
  }, [transactions, compact, limit, filter, category, sort, query]);

  const shown = flat ? flat.length : groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <section className="panel list-panel">
      <div className="list-head">
        <h2>{compact ? 'Recent transactions' : `Transactions${transactions.length ? ` (${shown})` : ''}`}</h2>
        {compact && transactions.length > 0 && (
          <button type="button" className="link-btn" onClick={onSeeAll}>
            See all <Icon name="chevR" size={16} />
          </button>
        )}
      </div>

      {!compact && transactions.length > 0 && (
        <div className="controls">
          <label className="search">
            <Icon name="search" size={17} />
            <input
              type="search"
              placeholder="Search category, note or method"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="seg" role="group" aria-label="Filter by type">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={filter === f.id ? 'on' : ''}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="skeletons" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="skeleton-row" key={i}>
              <span className="sk sk-circle" />
              <span className="sk sk-line" />
              <span className="sk sk-amount" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="list"
          title="Nothing here yet"
          text="Add your first transaction for this month."
          action={<button type="button" className="btn primary" onClick={() => onAdd()}>Add transaction</button>}
        />
      ) : shown === 0 ? (
        <EmptyState small icon="search" text="No transactions match your filters." />
      ) : flat ? (
        <ul className="flat">
          {flat.map((t) => (
            <Row key={t._id} t={t} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      ) : (
        groups.map((g) => (
          <div className="day" key={g.day}>
            <div className="day-head">
              <span>{dayLabel(g.day)}</span>
              {g.spent > 0 && <span>Spent {formatMoney(g.spent)}</span>}
            </div>
            <ul>
              {g.items.map((t) => (
                <Row key={t._id} t={t} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}
