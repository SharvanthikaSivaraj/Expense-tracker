import { useEffect, useRef, useState } from 'react';
import { categoryMeta, CATEGORIES, formatMoney, todayISO } from '../constants';
import Icon from './Icon';

// Shared submit handling: validate, call onSave, surface server errors
function useSubmit(validate, build, onSave) {
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e, values) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;
    setSaving(true);
    try {
      await onSave(build(values));
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  }
  return { errors, serverError, saving, submit };
}

function Actions({ saving, onCancel, label }) {
  return (
    <div className="form-actions">
      <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
      <button type="submit" className="btn primary" disabled={saving}>{saving ? 'Saving...' : label}</button>
    </div>
  );
}

const ServerError = ({ message }) => (message ? <div className="banner error" role="alert">{message}</div> : null);

function MoneyField({ id, label, value, onChange, error, tone = 'expense', placeholder = '0' }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`amount-input ${tone}`}>
        <span>₹</span>
        <input id={id} type="number" inputMode="decimal" step="0.01" min="0" placeholder={placeholder} value={value} onChange={onChange} />
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

export function BudgetForm({ budget, takenCategories, onSave, onCancel }) {
  const editing = Boolean(budget);
  const [category, setCategory] = useState(budget?.category || '');
  const [limit, setLimit] = useState(budget ? String(budget.limit) : '');
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);

  const { errors, serverError, saving, submit } = useSubmit(
    (v) => {
      const er = {};
      if (!v.category) er.category = 'Choose what to budget';
      if (v.limit === '' || Number.isNaN(Number(v.limit)) || Number(v.limit) < 1) er.limit = 'Enter a limit of at least 1';
      return er;
    },
    (v) => (editing ? { limit: Number(v.limit) } : { category: v.category, limit: Number(v.limit) }),
    onSave
  );

  const options = [{ value: 'ALL', label: 'Overall', icon: 'wallet' }, ...CATEGORIES.expense.map((c) => ({ value: c, label: c, icon: categoryMeta(c).icon }))];

  return (
    <form className="form" onSubmit={(e) => submit(e, { category, limit })} noValidate>
      {!editing && (
        <div className="field">
          <span className="field-label">Budget for</span>
          <div className="chips" role="group" aria-label="Budget category">
            {options.map((o) => {
              const taken = takenCategories.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  className={`chip ${category === o.value ? 'on' : ''}`}
                  aria-pressed={category === o.value}
                  disabled={taken}
                  title={taken ? 'Already has a budget' : undefined}
                  onClick={() => setCategory(o.value)}
                >
                  <Icon name={o.icon} size={16} />
                  {o.label}
                </button>
              );
            })}
          </div>
          {errors.category && <span className="field-error">{errors.category}</span>}
        </div>
      )}
      {editing && <p className="muted">Budget for <strong>{budget.category === 'ALL' ? 'Overall spending' : budget.category}</strong></p>}
      <div className="field">
        <label htmlFor="b-limit">Monthly limit</label>
        <div className="amount-input expense">
          <span>₹</span>
          <input id="b-limit" ref={ref} type="number" inputMode="decimal" min="0" placeholder="e.g. 5000" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </div>
        {errors.limit && <span className="field-error">{errors.limit}</span>}
      </div>
      <ServerError message={serverError} />
      <Actions saving={saving} onCancel={onCancel} label={editing ? 'Save budget' : 'Add budget'} />
    </form>
  );
}

export function GoalForm({ goal, onSave, onCancel }) {
  const editing = Boolean(goal);
  const [v, setV] = useState({
    name: goal?.name || '',
    target: goal ? String(goal.target) : '',
    saved: goal ? String(goal.saved) : '',
    deadline: goal?.deadline ? goal.deadline.slice(0, 10) : '',
  });
  const set = (f) => (e) => setV((x) => ({ ...x, [f]: e.target.value }));

  const { errors, serverError, saving, submit } = useSubmit(
    (x) => {
      const er = {};
      if (!x.name.trim()) er.name = 'Give your goal a name';
      if (x.target === '' || Number(x.target) < 1) er.target = 'Enter a target of at least 1';
      if (x.saved !== '' && (Number.isNaN(Number(x.saved)) || Number(x.saved) < 0)) er.saved = 'Enter 0 or more';
      return er;
    },
    (x) => ({ name: x.name.trim(), target: Number(x.target), saved: x.saved === '' ? 0 : Number(x.saved), deadline: x.deadline || '' }),
    onSave
  );

  return (
    <form className="form" onSubmit={(e) => submit(e, v)} noValidate>
      <div className="field">
        <label htmlFor="g-name">Goal name</label>
        <input id="g-name" className="text-input" placeholder="e.g. Goa trip" value={v.name} onChange={set('name')} autoFocus />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>
      <MoneyField id="g-target" label="Target amount" value={v.target} onChange={set('target')} error={errors.target} tone="income" />
      <MoneyField id="g-saved" label="Already saved" value={v.saved} onChange={set('saved')} error={errors.saved} tone="income" />
      <div className="field">
        <label htmlFor="g-deadline">Deadline <span className="muted">(optional)</span></label>
        <input id="g-deadline" type="date" value={v.deadline} onChange={set('deadline')} />
      </div>
      <ServerError message={serverError} />
      <Actions saving={saving} onCancel={onCancel} label={editing ? 'Save goal' : 'Add goal'} />
    </form>
  );
}

export function MoneyForm({ goal, onSave, onCancel }) {
  const [mode, setMode] = useState('add');
  const [amount, setAmount] = useState('');

  const { errors, serverError, saving, submit } = useSubmit(
    (x) => (x.amount === '' || Number.isNaN(Number(x.amount)) || Number(x.amount) <= 0 ? { amount: 'Enter an amount greater than 0' } : {}),
    (x) => (x.mode === 'add' ? Number(x.amount) : -Number(x.amount)),
    onSave
  );

  return (
    <form className="form" onSubmit={(e) => submit(e, { mode, amount })} noValidate>
      <p className="muted">
        {goal.name}: {formatMoney(goal.saved)} saved of {formatMoney(goal.target)}
      </p>
      <div className="type-switch" role="group" aria-label="Add or withdraw">
        {[['add', 'Add money'], ['withdraw', 'Withdraw']].map(([id, label]) => (
          <button key={id} type="button" className={mode === id ? `on ${id === 'add' ? 'income' : 'expense'}` : ''} aria-pressed={mode === id} onClick={() => setMode(id)}>
            {label}
          </button>
        ))}
      </div>
      <MoneyField id="m-amount" label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} tone={mode === 'add' ? 'income' : 'expense'} />
      <ServerError message={serverError} />
      <Actions saving={saving} onCancel={onCancel} label={mode === 'add' ? 'Add to goal' : 'Withdraw'} />
    </form>
  );
}

export function ReminderForm({ reminder, onSave, onCancel }) {
  const editing = Boolean(reminder);
  const [v, setV] = useState({
    title: reminder?.title || '',
    amount: reminder ? String(reminder.amount) : '',
    dueDate: reminder ? reminder.dueDate.slice(0, 10) : todayISO(),
    repeat: reminder?.repeat || 'none',
    category: reminder?.category || 'Bills',
  });
  const set = (f) => (e) => setV((x) => ({ ...x, [f]: e.target.value }));

  const { errors, serverError, saving, submit } = useSubmit(
    (x) => {
      const er = {};
      if (!x.title.trim()) er.title = 'What is this bill for?';
      if (x.amount === '' || Number.isNaN(Number(x.amount)) || Number(x.amount) <= 0) er.amount = 'Enter an amount greater than 0';
      if (!x.dueDate) er.dueDate = 'Pick a due date';
      return er;
    },
    (x) => ({ title: x.title.trim(), amount: Number(x.amount), dueDate: x.dueDate, repeat: x.repeat, category: x.category }),
    onSave
  );

  return (
    <form className="form" onSubmit={(e) => submit(e, v)} noValidate>
      <div className="field">
        <label htmlFor="r-title">Bill name</label>
        <input id="r-title" className="text-input" placeholder="e.g. Electricity bill" value={v.title} onChange={set('title')} autoFocus />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>
      <MoneyField id="r-amount" label="Amount" value={v.amount} onChange={set('amount')} error={errors.amount} />
      <div className="field">
        <label htmlFor="r-due">Due date</label>
        <input id="r-due" type="date" value={v.dueDate} onChange={set('dueDate')} />
        {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
      </div>
      <div className="field">
        <span className="field-label">Repeats</span>
        <div className="chips" role="group" aria-label="Repeat">
          {[['none', 'One time'], ['monthly', 'Every month']].map(([id, label]) => (
            <button key={id} type="button" className={`chip ${v.repeat === id ? 'on' : ''}`} aria-pressed={v.repeat === id} onClick={() => setV((x) => ({ ...x, repeat: id }))}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span className="field-label">Category</span>
        <div className="chips" role="group" aria-label="Category">
          {CATEGORIES.expense.map((c) => (
            <button key={c} type="button" className={`chip ${v.category === c ? 'on' : ''}`} style={{ '--chip': categoryMeta(c).color }} aria-pressed={v.category === c} onClick={() => setV((x) => ({ ...x, category: c }))}>
              <Icon name={categoryMeta(c).icon} size={16} />
              {c}
            </button>
          ))}
        </div>
      </div>
      <ServerError message={serverError} />
      <Actions saving={saving} onCancel={onCancel} label={editing ? 'Save bill' : 'Add bill'} />
    </form>
  );
}
