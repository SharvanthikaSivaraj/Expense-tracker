import { useCallback, useState } from 'react';
import {
  contributeGoal,
  createBudget,
  createGoal,
  createReminder,
  deleteBudget,
  deleteGoal,
  deleteReminder,
  payReminder,
  updateBudget,
  updateGoal,
  updateReminder,
} from '../api';
import BudgetCard from '../components/BudgetCard';
import Drawer from '../components/Drawer';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { BudgetForm, GoalForm, MoneyForm, ReminderForm } from '../components/PlanForms';
import { categoryMeta, daysUntil, dueInfo, formatDate, formatMoney } from '../constants';

const TABS = [
  { id: 'budgets', label: 'Budgets' },
  { id: 'goals', label: 'Goals' },
  { id: 'bills', label: 'Bills' },
];

const stateOf = (ratio) => (ratio > 1 ? 'over' : ratio >= 0.75 ? 'warn' : 'ok');

export default function Plan({ tab, onTab, summary, budgets, goals, reminders, onChanged, onError }) {
  const [drawer, setDrawer] = useState(null); // { kind, item }
  const close = useCallback(() => setDrawer(null), []);
  const open = (kind, item = null) => setDrawer({ kind, item });

  // Form handlers throw so the form can show the error; everything else reports through onError
  const save = (fn, message) => async (body) => {
    await fn(body);
    close();
    onChanged(message);
  };

  async function act(fn, message) {
    try {
      await fn();
      onChanged(message);
    } catch (err) {
      onError(err.message);
    }
  }

  const confirmThen = (text, fn, message) => {
    if (window.confirm(text)) act(fn, message);
  };

  // ---------- budgets ----------
  const spent = Object.fromEntries(summary.byCategory.map((c) => [c._id, c.total]));
  const overall = budgets.find((b) => b.category === 'ALL');
  const categoryBudgets = budgets.filter((b) => b.category !== 'ALL');

  // ---------- bills ----------
  const unpaid = reminders.filter((r) => !r.paid);
  const paid = reminders.filter((r) => r.paid);
  const dueSoon = unpaid.filter((r) => daysUntil(r.dueDate) <= 7).reduce((s, r) => s + r.amount, 0);

  return (
    <div className="plan">
      <div className="seg wide plan-tabs" role="tablist" aria-label="Plan sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => onTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'budgets' && (
        <div className="plan-grid">
          <div className="stack">
            <BudgetCard expense={summary.expense} budget={overall?.limit || 0} onSetup={() => open('budget')} />
            {overall && (
              <div className="plan-actions">
                <button type="button" className="btn" onClick={() => open('budget', overall)}>
                  <Icon name="edit" size={16} /> Edit overall budget
                </button>
                <button type="button" className="btn danger" onClick={() => confirmThen('Remove the overall budget?', () => deleteBudget(overall._id), 'Budget removed')}>
                  <Icon name="trash" size={16} /> Remove
                </button>
              </div>
            )}
          </div>

          <section className="panel">
            <div className="list-head">
              <h2>By category</h2>
              <button type="button" className="link-btn" onClick={() => open('budget')}>
                <Icon name="plus" size={16} /> Add budget
              </button>
            </div>
            {categoryBudgets.length === 0 ? (
              <EmptyState small icon="target" text="No category budgets yet. Limit what you spend on food, shopping and more." />
            ) : (
              <ul className="budget-rows">
                {categoryBudgets.map((b) => {
                  const used = spent[b.category] || 0;
                  const ratio = used / b.limit;
                  const meta = categoryMeta(b.category);
                  return (
                    <li key={b._id} className="budget-row">
                      <span className="row-icon" style={{ background: `${meta.color}26`, color: meta.color }}>
                        <Icon name={meta.icon} size={18} />
                      </span>
                      <div className="budget-main">
                        <div className="budget-line">
                          <strong>{b.category}</strong>
                          <span className="muted">
                            {formatMoney(used)} of {formatMoney(b.limit)}
                          </span>
                        </div>
                        <div className={`bar ${stateOf(ratio)}`} role="img" aria-label={`${Math.round(ratio * 100)}% used`}>
                          <span style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                        </div>
                        <small className={`budget-note ${stateOf(ratio)}`}>
                          {ratio > 1 ? `Over by ${formatMoney(used - b.limit)}` : `${formatMoney(b.limit - used)} left`}
                        </small>
                      </div>
                      <span className="row-actions always">
                        <button type="button" className="icon-btn" aria-label={`Edit ${b.category} budget`} onClick={() => open('budget', b)}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button type="button" className="icon-btn danger" aria-label={`Delete ${b.category} budget`} onClick={() => confirmThen(`Remove the ${b.category} budget?`, () => deleteBudget(b._id), 'Budget removed')}>
                          <Icon name="trash" size={16} />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'goals' && (
        <section className="panel">
          <div className="list-head">
            <h2>Savings goals</h2>
            <button type="button" className="link-btn" onClick={() => open('goal')}>
              <Icon name="plus" size={16} /> Add goal
            </button>
          </div>
          {goals.length === 0 ? (
            <EmptyState icon="target" title="No goals yet" text="Save towards a trip, a laptop or an emergency fund." action={<button type="button" className="btn primary" onClick={() => open('goal')}>Add goal</button>} />
          ) : (
            <div className="goal-grid">
              {goals.map((g) => {
                const pct = Math.min(100, (g.saved / g.target) * 100);
                const done = g.saved >= g.target;
                const left = Math.max(0, g.target - g.saved);
                const days = g.deadline ? daysUntil(g.deadline) : null;
                const perMonth = !done && days !== null && days > 0 ? left / Math.max(1, Math.ceil(days / 30)) : null;
                return (
                  <article key={g._id} className="goal">
                    <div className="goal-head">
                      <strong>{g.name}</strong>
                      <span className="row-actions always">
                        <button type="button" className="icon-btn" aria-label={`Edit ${g.name}`} onClick={() => open('goal', g)}>
                          <Icon name="edit" size={16} />
                        </button>
                        <button type="button" className="icon-btn danger" aria-label={`Delete ${g.name}`} onClick={() => confirmThen(`Delete the goal "${g.name}"?`, () => deleteGoal(g._id), 'Goal deleted')}>
                          <Icon name="trash" size={16} />
                        </button>
                      </span>
                    </div>
                    <div className="goal-figure">
                      <strong>{formatMoney(g.saved)}</strong>
                      <span className="muted">of {formatMoney(g.target)}</span>
                    </div>
                    <div className={`bar ${done ? 'ok done' : 'ok'}`} role="img" aria-label={`${Math.round(pct)}% saved`}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="goal-meta">
                      <span>{done ? 'Goal reached' : `${Math.round(pct)}% saved`}</span>
                      <span className="muted">
                        {g.deadline ? (days < 0 && !done ? `Deadline passed ${formatDate(g.deadline)}` : `By ${formatDate(g.deadline)}`) : 'No deadline'}
                      </span>
                    </div>
                    {perMonth !== null && <p className="muted goal-hint">Save about {formatMoney(Math.ceil(perMonth))} a month to finish on time.</p>}
                    <button type="button" className="btn block" onClick={() => open('money', g)}>
                      <Icon name="plus" size={16} /> Add or withdraw
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'bills' && (
        <section className="panel">
          <div className="list-head">
            <h2>Bills and reminders</h2>
            <button type="button" className="link-btn" onClick={() => open('reminder')}>
              <Icon name="plus" size={16} /> Add bill
            </button>
          </div>
          {unpaid.length > 0 && (
            <p className="muted bills-summary">
              {dueSoon > 0 ? `${formatMoney(dueSoon)} due in the next 7 days` : 'Nothing due in the next 7 days'}
            </p>
          )}
          {reminders.length === 0 ? (
            <EmptyState icon="calendar" title="No bills yet" text="Add rent, utilities or subscriptions so nothing slips by." action={<button type="button" className="btn primary" onClick={() => open('reminder')}>Add bill</button>} />
          ) : (
            <ul className="bill-rows">
              {[...unpaid, ...paid].map((r) => {
                const due = dueInfo(r.dueDate);
                const meta = categoryMeta(r.category);
                return (
                  <li key={r._id} className={`bill-row ${r.paid ? 'is-paid' : ''}`}>
                    <span className="row-icon" style={{ background: `${meta.color}26`, color: meta.color }}>
                      <Icon name={meta.icon} size={18} />
                    </span>
                    <div className="row-main">
                      <strong>{r.title}</strong>
                      <span className="row-sub">
                        {r.paid ? <span className="due-chip ok">Paid</span> : <span className={`due-chip ${due.tone}`}>{due.label}</span>}
                        <span className="tag">{r.repeat === 'monthly' ? 'Monthly' : 'One time'}</span>
                        <span className="muted">{formatDate(r.dueDate)}</span>
                      </span>
                    </div>
                    <span className="bill-amount">{formatMoney(r.amount)}</span>
                    {!r.paid && (
                      <button type="button" className="btn small primary" onClick={() => act(() => payReminder(r._id, {}), `${r.title} paid and recorded`)}>
                        Mark paid
                      </button>
                    )}
                    <span className="row-actions always">
                      <button type="button" className="icon-btn" aria-label={`Edit ${r.title}`} onClick={() => open('reminder', r)}>
                        <Icon name="edit" size={16} />
                      </button>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${r.title}`} onClick={() => confirmThen(`Delete the bill "${r.title}"?`, () => deleteReminder(r._id), 'Bill deleted')}>
                        <Icon name="trash" size={16} />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {drawer?.kind === 'budget' && (
        <Drawer title={drawer.item ? 'Edit budget' : 'New budget'} onClose={close}>
          <BudgetForm
            key={drawer.item?._id || 'new-budget'}
            budget={drawer.item}
            takenCategories={budgets.map((b) => b.category)}
            onSave={save((body) => (drawer.item ? updateBudget(drawer.item._id, body) : createBudget(body)), drawer.item ? 'Budget updated' : 'Budget added')}
            onCancel={close}
          />
        </Drawer>
      )}
      {drawer?.kind === 'goal' && (
        <Drawer title={drawer.item ? 'Edit goal' : 'New goal'} onClose={close}>
          <GoalForm
            key={drawer.item?._id || 'new-goal'}
            goal={drawer.item}
            onSave={save((body) => (drawer.item ? updateGoal(drawer.item._id, body) : createGoal(body)), drawer.item ? 'Goal updated' : 'Goal added')}
            onCancel={close}
          />
        </Drawer>
      )}
      {drawer?.kind === 'money' && (
        <Drawer title="Add or withdraw" onClose={close}>
          <MoneyForm key={drawer.item._id} goal={drawer.item} onSave={save((amount) => contributeGoal(drawer.item._id, amount), 'Goal updated')} onCancel={close} />
        </Drawer>
      )}
      {drawer?.kind === 'reminder' && (
        <Drawer title={drawer.item ? 'Edit bill' : 'New bill'} onClose={close}>
          <ReminderForm
            key={drawer.item?._id || 'new-bill'}
            reminder={drawer.item}
            onSave={save((body) => (drawer.item ? updateReminder(drawer.item._id, body) : createReminder(body)), drawer.item ? 'Bill updated' : 'Bill added')}
            onCancel={close}
          />
        </Drawer>
      )}
    </div>
  );
}
