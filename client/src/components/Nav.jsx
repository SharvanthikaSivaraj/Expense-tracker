import Icon from './Icon';

const ITEMS = [
  { id: 'dashboard', label: 'Home', icon: 'home' },
  { id: 'transactions', label: 'Transactions', icon: 'list' },
];

export default function Nav({ view, onView, onAdd, dark, onToggleTheme, user, onLogout }) {
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const item = (it) => (
    <li key={it.id}>
      <button
        type="button"
        className={view === it.id ? 'on' : ''}
        aria-current={view === it.id ? 'page' : undefined}
        onClick={() => onView(it.id)}
      >
        <Icon name={it.icon} />
        <span>{it.label}</span>
      </button>
    </li>
  );

  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-brand">
        <span className="logo" aria-hidden="true">₹</span>
        <span className="nav-title">Expense Tracker</span>
      </div>

      <button type="button" className="btn primary add-new" onClick={onAdd}>
        <Icon name="plus" size={18} /> Add New
      </button>

      <ul className="nav-list">
        {ITEMS.map(item)}
      </ul>

      <button type="button" className="nav-theme" onClick={onToggleTheme}>
        <Icon name={dark ? 'sun' : 'moon'} />
        <span>{dark ? 'Light mode' : 'Dark mode'}</span>
      </button>

      <div className="nav-user">
        <span className="avatar" aria-hidden="true">{initials}</span>
        <div className="nav-user-info">
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
        <button type="button" className="icon-btn" aria-label="Log out" onClick={onLogout}>
          <Icon name="logout" size={18} />
        </button>
      </div>
    </nav>
  );
}
