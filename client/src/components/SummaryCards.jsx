import { useEffect, useRef, useState } from 'react';
import { categoryMeta, currentMonth, daysInMonth, formatMoney, monthLabel, todayISO } from '../constants';
import Icon from './Icon';

const wholeFmt = new Intl.NumberFormat('en-IN');

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Smoothly animates a number towards its target value
function useCountUp(target, ms = 650) {
  const [value, setValue] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    const start = from.current;
    const delta = target - start;
    const duration = reduceMotion() ? 0 : ms;
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = duration ? Math.min(1, (now - t0) / duration) : 1;
      const val = p < 1 ? Math.round(start + delta * (1 - Math.pow(1 - p, 3))) : target;
      from.current = val;
      setValue(val);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}

export default function SummaryCards({ summary, prevSummary, transactions, month, totalBalance = 0, onAdd }) {
  const { income, expense, balance, byCategory } = summary;
  const shownBalance = useCountUp(totalBalance);
  const [whole, cents] = Math.abs(shownBalance).toFixed(2).split('.');

  const spentPct = income > 0 ? Math.min(100, (expense / income) * 100) : expense > 0 ? 100 : 0;

  const top = byCategory[0];
  const biggest = transactions
    .filter((t) => t.type === 'expense')
    .reduce((max, t) => (!max || t.amount > max.amount ? t : max), null);

  // Average over the days that have passed (whole month if it is already over)
  const isCurrent = month === currentMonth();
  const days = isCurrent ? Number(todayISO().slice(8)) : daysInMonth(month);
  const dailyAvg = expense > 0 ? expense / days : 0;

  const prevExpense = prevSummary?.expense || 0;
  // a month with no spending yet cannot be compared fairly, so show nothing instead of "100% down"
  const delta = prevExpense > 0 && expense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null;

  return (
    <section className="summary">
      <div className="hero">
        <div className="hero-main">
          <span className="hero-label">Total balance</span>
          <small className="hero-sub">Across all your accounts</small>
          <div className="hero-amount" aria-label={formatMoney(totalBalance)}>
            <span className="cur">{shownBalance < 0 ? '−₹' : '₹'}</span>
            {wholeFmt.format(Number(whole))}
            <span className="cents">.{cents}</span>
          </div>
          <span className="pill">
            {monthLabel(month)}: {balance < 0 ? '−' : '+'}
            {formatMoney(Math.abs(balance))}
          </span>
        </div>

        <div className="hero-flow">
          <div className="flow-item">
            <span className="flow-dot up"><Icon name="arrowDown" size={14} /></span>
            <div>
              <small>Income</small>
              <strong>{formatMoney(income)}</strong>
            </div>
          </div>
          <div className="flow-item">
            <span className="flow-dot down"><Icon name="arrowUp" size={14} /></span>
            <div>
              <small>Expense</small>
              <strong>{formatMoney(expense)}</strong>
            </div>
          </div>
        </div>

        <div className="hero-wide">
          <div className="meter" role="img" aria-label={`Spent ${Math.round(spentPct)}% of income`}>
            <div className="meter-fill" style={{ width: `${spentPct}%` }} />
          </div>
          <small className="meter-caption">
            {income > 0
              ? `${Math.round(spentPct)}% of your income spent`
              : expense > 0
                ? 'Spending with no income recorded'
                : 'No activity yet'}
          </small>
        </div>

        <div className="hero-actions hero-wide">
          <button type="button" className="glass-btn" onClick={() => onAdd('income')}>
            <Icon name="arrowDown" size={16} /> Add income
          </button>
          <button type="button" className="glass-btn" onClick={() => onAdd('expense')}>
            <Icon name="arrowUp" size={16} /> Add expense
          </button>
        </div>
      </div>

      <div className="tiles">
        <div className="tile" style={{ '--b': 'var(--primary)' }}>
          <div className="tile-head">
            <small>Top category</small>
            <span className="tile-badge"><Icon name="chart" size={16} /></span>
          </div>
          {top ? (
            <>
              <strong>
                <span className="tile-icon"><Icon name={categoryMeta(top._id).icon} size={18} /></span> {top._id}
              </strong>
              <span className="muted">
                {formatMoney(top.total)} · {Math.round((top.total / expense) * 100)}%
              </span>
            </>
          ) : (
            <strong className="dim">-</strong>
          )}
        </div>
        <div className="tile" style={{ '--b': 'var(--expense)' }}>
          <div className="tile-head">
            <small>Biggest expense</small>
            <span className="tile-badge"><Icon name="arrowUp" size={16} /></span>
          </div>
          {biggest ? (
            <>
              <strong>{formatMoney(biggest.amount)}</strong>
              <span className="muted">{biggest.category}</span>
            </>
          ) : (
            <strong className="dim">-</strong>
          )}
        </div>
        <div className="tile" style={{ '--b': 'var(--warn)' }}>
          <div className="tile-head">
            <small>Daily average</small>
            <span className="tile-badge"><Icon name="calendar" size={16} /></span>
          </div>
          {dailyAvg > 0 ? (
            <>
              <strong>{formatMoney(Math.round(dailyAvg))}</strong>
              <span className="muted">per day</span>
            </>
          ) : (
            <strong className="dim">-</strong>
          )}
        </div>
        <div className="tile" style={{ '--b': 'var(--income)' }}>
          <div className="tile-head">
            <small>Vs last month</small>
            <span className="tile-badge"><Icon name="trend" size={16} /></span>
          </div>
          {delta === null ? (
            <>
              <strong className="dim">-</strong>
              <span className="muted">{expense === 0 ? 'no spending yet' : 'no data last month'}</span>
            </>
          ) : (
            <>
              <strong className={delta > 0 ? 'bad' : 'good'}>
                {delta !== 0 && <Icon name={delta > 0 ? 'arrowUp' : 'arrowDown'} size={16} />} {Math.abs(delta)}%
              </strong>
              <span className="muted">spending {delta > 0 ? 'up' : delta < 0 ? 'down' : 'unchanged'}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
