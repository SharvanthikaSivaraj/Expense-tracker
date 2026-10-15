import { accountTypeMeta, networkLabel } from '../constants';
import Icon from './Icon';

function NetworkMark({ network }) {
  if (network === 'mastercard') {
    return (
      <span className="net net-mastercard" aria-label="Mastercard">
        <i />
        <i />
      </span>
    );
  }
  if (!network) return null;
  return <span className={`net net-text net-${network}`}>{networkLabel(network)}</span>;
}

// A payment card drawn at real card proportions
export default function BankCard({ account, holder }) {
  const kind = accountTypeMeta(account.type).label;
  const last4 = account.last4 || '••••';

  return (
    <div
      className={`bcard acct-${account.color || 'teal'}`}
      role="img"
      aria-label={`${account.name}, ${kind}, ending ${last4}`}
    >
      <span className="bc-top">
        <span className="bc-kind">{kind}</span>
        <span className="bc-bank">{account.name}</span>
      </span>

      <span className="bc-mid">
        <span className="bc-chip" aria-hidden="true" />
        <Icon name="contactless" size={22} />
      </span>

      <span className="bc-number">
        <span>••••</span>
        <span>••••</span>
        <span>••••</span>
        <span>{last4}</span>
      </span>

      <span className="bc-bottom">
        <span className="bc-valid">
          <small>VALID THRU</small>
          <b>{account.expiry || '--/--'}</b>
        </span>
        <span className="bc-holder">{holder.toUpperCase()}</span>
        <NetworkMark network={account.network} />
      </span>
    </div>
  );
}
