import { accountTypeMeta, formatMoney, networkLabel } from '../constants';
import BankCard from './BankCard';
import Icon from './Icon';

// Each card is shown separately with its own figures and actions underneath
export default function CardShowcase({ cards, holder, onEdit, onDelete }) {
  return (
    <div className="cards-row">
      {cards.map((card) => {
        const credit = card.type === 'credit_card';
        const used = credit ? Math.max(0, -card.balance) : 0;
        const limit = card.creditLimit || 0;
        const usedPct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

        return (
          <article className="card-unit" key={card._id}>
            <BankCard account={card} holder={holder} />

            <div className="card-detail">
              <div className="cd-line">
                <div className="cd-figure">
                  <small>{credit && used > 0 ? 'Outstanding' : 'Balance'}</small>
                  <strong>{formatMoney(credit && used > 0 ? used : card.balance)}</strong>
                </div>
                <span className="cd-actions">
                  <button type="button" className="icon-btn" aria-label={`Edit ${card.name}`} onClick={() => onEdit(card)}>
                    <Icon name="edit" size={17} />
                  </button>
                  <button type="button" className="icon-btn danger" aria-label={`Delete ${card.name}`} onClick={() => onDelete(card)}>
                    <Icon name="trash" size={17} />
                  </button>
                </span>
              </div>

              {credit && limit > 0 && (
                <div className="cd-util">
                  <div className="util-track" role="img" aria-label={`${Math.round(usedPct)}% of limit used`}>
                    <span style={{ width: `${usedPct}%` }} />
                  </div>
                  <div className="cd-util-text">
                    <span>{formatMoney(Math.max(0, limit - used))} available</span>
                    <span className="muted">limit {formatMoney(limit)}</span>
                  </div>
                </div>
              )}

              <div className="cd-meta muted">
                {accountTypeMeta(card.type).label}
                {card.network ? ` · ${networkLabel(card.network)}` : ''}
                {card.last4 ? ` · ending ${card.last4}` : ''}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
