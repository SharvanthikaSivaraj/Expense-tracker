import { accountTypeMeta, formatMoney } from '../constants';
import EmptyState from './EmptyState';
import Icon from './Icon';

export default function AccountsPanel({ accounts, onAdd, onSeeAll }) {
  if (accounts.length === 0) {
    return (
      <section className="panel">
        <h2>Accounts</h2>
        <EmptyState
          small
          icon="wallet"
          text="Add a bank, cash or card account to track balances."
          action={<button type="button" className="btn primary" onClick={onAdd}>Add account</button>}
        />
      </section>
    );
  }

  const net = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <section className="panel">
      <div className="list-head">
        <h2>Accounts</h2>
        <button type="button" className="link-btn" onClick={onSeeAll}>
          See all <Icon name="chevR" size={16} />
        </button>
      </div>
      <ul className="acct-list">
        {accounts.slice(0, 4).map((a) => (
          <li key={a._id}>
            <span className={`acct-dot acct-${a.color || 'teal'}`}>
              <Icon name={accountTypeMeta(a.type).icon} size={16} />
            </span>
            <span className="acct-list-name">{a.name}</span>
            <strong className={a.balance < 0 ? 'bad' : ''}>{formatMoney(a.balance)}</strong>
          </li>
        ))}
      </ul>
      <div className="acct-total">
        <span className="muted">Total in accounts</span>
        <strong className={net < 0 ? 'bad' : ''}>{formatMoney(net)}</strong>
      </div>
    </section>
  );
}
