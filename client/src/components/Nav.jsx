const ITEMS = [
  { id: 'dashboard', label: 'Home' },
  { id: 'transactions', label: 'Transactions' },
];

export default function Nav({ view, onView, onAdd, user, onLogout }) {
  return (
    <nav className="nav">
      <strong className="nav-title">Expense Tracker</strong>
      <div className="nav-links">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            type="button"
            className={view === it.id ? 'link on' : 'link'}
            onClick={() => onView(it.id)}
          >
            {it.label}
          </button>
        ))}
      </div>
      <button type="button" className="btn primary" onClick={onAdd}>Add transaction</button>
      <span className="nav-user">{user.name}</span>
      <button type="button" className="btn" onClick={onLogout}>Log out</button>
    </nav>
  );
}
