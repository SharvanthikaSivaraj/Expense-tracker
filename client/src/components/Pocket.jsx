import { accountTypeMeta, formatMoney } from '../constants';
import Icon from './Icon';

// Cash, bank and wallet accounts: a compact banknote-style tile, not a card
export default function Pocket({ account, onEdit, onDelete }) {
  const meta = accountTypeMeta(account.type);

  return (
    <article className={`pocket pk-${account.type}`}>
      <span className="pk-medal">
        <Icon name={meta.icon} size={20} />
      </span>
      <div className="pk-body">
        <small>{meta.label}</small>
        <strong>{account.name}</strong>
      </div>
      <div className="pk-amount">
        <strong className={account.balance < 0 ? 'bad' : ''}>{formatMoney(account.balance)}</strong>
      </div>
      <span className="pk-actions">
        <button type="button" className="icon-btn" aria-label={`Edit ${account.name}`} onClick={() => onEdit(account)}>
          <Icon name="edit" size={16} />
        </button>
        <button type="button" className="icon-btn danger" aria-label={`Delete ${account.name}`} onClick={() => onDelete(account)}>
          <Icon name="trash" size={16} />
        </button>
      </span>
    </article>
  );
}
