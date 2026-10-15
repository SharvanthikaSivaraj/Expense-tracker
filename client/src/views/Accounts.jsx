import CardShowcase from '../components/CardShowcase';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Pocket from '../components/Pocket';
import { formatMoney, isCardType } from '../constants';

export default function Accounts({ accounts, holder, loading, actions }) {
  const cards = accounts.filter((a) => isCardType(a.type));
  const pockets = accounts.filter((a) => !isCardType(a.type));

  const spendable = accounts.filter((a) => a.type !== 'credit_card').reduce((s, a) => s + a.balance, 0);
  const creditUsed = accounts.filter((a) => a.type === 'credit_card').reduce((s, a) => s + Math.max(0, -a.balance), 0);
  const net = accounts.reduce((s, a) => s + a.balance, 0);

  if (!loading && accounts.length === 0) {
    return (
      <section className="panel">
        <EmptyState
          icon="wallet"
          title="No accounts yet"
          text="Add your bank, cash, wallet or cards to see where your money sits and link transactions to them."
          action={
            <button type="button" className="btn primary" onClick={actions.addAccount}>
              Add account
            </button>
          }
        />
      </section>
    );
  }

  return (
    <div className="accounts-view">
      <div className="acct-summary">
        <div className="tile" style={{ '--b': 'var(--primary)' }}>
          <div className="tile-head">
            <small>Net balance</small>
            <span className="tile-badge"><Icon name="wallet" size={16} /></span>
          </div>
          <strong className={net < 0 ? 'bad' : ''}>{formatMoney(net)}</strong>
        </div>
        <div className="tile" style={{ '--b': 'var(--income)' }}>
          <div className="tile-head">
            <small>Cash and bank</small>
            <span className="tile-badge"><Icon name="bank" size={16} /></span>
          </div>
          <strong>{formatMoney(spendable)}</strong>
        </div>
        <div className="tile" style={{ '--b': 'var(--warn)' }}>
          <div className="tile-head">
            <small>Credit used</small>
            <span className="tile-badge"><Icon name="card" size={16} /></span>
          </div>
          <strong>{formatMoney(creditUsed)}</strong>
        </div>
      </div>

      {cards.length > 0 && (
        <section className="panel static">
          <div className="list-head">
            <h2>Cards</h2>
            <button type="button" className="link-btn" onClick={actions.addAccount}>
              <Icon name="plus" size={16} /> Add account
            </button>
          </div>
          <CardShowcase cards={cards} holder={holder} onEdit={actions.editAccount} onDelete={actions.removeAccount} />
        </section>
      )}

      <section className="panel">
        <div className="list-head">
          <h2>Cash, bank and wallets</h2>
          {cards.length === 0 && (
            <button type="button" className="link-btn" onClick={actions.addAccount}>
              <Icon name="plus" size={16} /> Add account
            </button>
          )}
        </div>
        <div className="pocket-grid">
          {pockets.map((a) => (
            <Pocket key={a._id} account={a} onEdit={actions.editAccount} onDelete={actions.removeAccount} />
          ))}
          <button type="button" className="pocket pocket-add" onClick={actions.addAccount}>
            <Icon name="plus" size={18} /> Add
          </button>
        </div>
      </section>
    </div>
  );
}
