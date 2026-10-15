import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { formatMoney } from '../constants';

const BARS = [38, 62, 45, 80, 56, 92, 68];
const FEED = [
  { icon: 'briefcase', label: 'Salary', amount: '+₹50,000', up: true },
  { icon: 'food', label: 'Groceries', amount: '−₹900', up: false },
  { icon: 'bus', label: 'Metro recharge', amount: '−₹300', up: false },
];
const RING = 2 * Math.PI * 26;

function useCountUp(target, ms = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = reduce ? 1 : Math.min(1, (now - t0) / ms);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

// Decorative product preview shown beside the login form
export default function AuthPreview() {
  const balance = useCountUp(40700);

  return (
    <div className="preview" aria-hidden="true">
      <div className="pv-card pv-main">
        <div className="pv-top">
          <span>Total balance</span>
          <span className="pv-pill">+12% vs last month</span>
        </div>
        <div className="pv-amount">{formatMoney(balance)}</div>
        <div className="pv-bars">
          {BARS.map((h, i) => (
            <i key={i} style={{ '--h': `${h}%`, '--i': i }} />
          ))}
        </div>
      </div>

      <div className="pv-card pv-budget">
        <svg viewBox="0 0 64 64" width="64" height="64">
          <circle cx="32" cy="32" r="26" className="pv-track" />
          <circle
            cx="32"
            cy="32"
            r="26"
            className="pv-fill"
            strokeDasharray={RING}
            strokeDashoffset={RING * 0.28}
            transform="rotate(-90 32 32)"
          />
        </svg>
        <div>
          <strong>72%</strong>
          <small>of budget used</small>
        </div>
      </div>

      <div className="pv-card pv-feed">
        {FEED.map((row, i) => (
          <div className="pv-row" key={row.label} style={{ '--i': i }}>
            <span className="pv-icon">
              <Icon name={row.icon} size={16} />
            </span>
            <span className="pv-label">{row.label}</span>
            <strong className={row.up ? 'up' : ''}>{row.amount}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
