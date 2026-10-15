import { useEffect, useRef, useState } from 'react';
import { accountTypeMeta, categoryMeta, CATEGORIES, PAYMENT_METHODS, toInputDate } from '../constants';
import Icon from './Icon';

function initialValues(transaction, defaultDate, defaultType = 'expense') {
  if (transaction) {
    return {
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: toInputDate(transaction.date),
      paymentMethod: transaction.paymentMethod,
      account: transaction.account || '',
      note: transaction.note || '',
    };
  }
  return { amount: '', type: defaultType, category: '', date: defaultDate, paymentMethod: 'upi', account: '', note: '' };
}

function validate(v) {
  const errors = {};
  const amount = Number(v.amount);
  if (v.amount === '' || Number.isNaN(amount) || amount <= 0) errors.amount = 'Enter an amount greater than 0';
  if (!v.category) errors.category = 'Choose a category';
  if (!v.date) errors.date = 'Pick a date';
  if (v.note.length > 200) errors.note = 'Note must be 200 characters or fewer';
  return errors;
}

export default function TransactionForm({ transaction, accounts = [], defaultDate, defaultType, onSave, onCancel }) {
  const [values, setValues] = useState(() => initialValues(transaction, defaultDate, defaultType));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const amountRef = useRef(null);
  const editing = Boolean(transaction);

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const pick = (field, value) => setValues((v) => ({ ...v, [field]: value }));

  const setType = (type) =>
    setValues((v) => ({ ...v, type, category: CATEGORIES[type].includes(v.category) ? v.category : '' }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSave({
        ...values,
        amount: Number(values.amount),
        account: values.account || null,
        note: values.note.trim(),
      });
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="type-switch" role="group" aria-label="Type">
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            type="button"
            className={values.type === t ? `on ${t}` : ''}
            aria-pressed={values.type === t}
            onClick={() => setType(t)}
          >
            {t === 'expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="amount">Amount</label>
        <div className={`amount-input ${values.type}`}>
          <span>₹</span>
          <input
            id="amount"
            ref={amountRef}
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            value={values.amount}
            onChange={set('amount')}
          />
        </div>
        {errors.amount && <span className="field-error">{errors.amount}</span>}
      </div>

      <div className="field">
        <span className="field-label">Category</span>
        <div className="chips" role="group" aria-label="Category">
          {CATEGORIES[values.type].map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${values.category === c ? 'on' : ''}`}
              aria-pressed={values.category === c}
              style={{ '--chip': categoryMeta(c).color }}
              onClick={() => pick('category', c)}
            >
              <Icon name={categoryMeta(c).icon} size={16} />
              {c}
            </button>
          ))}
        </div>
        {errors.category && <span className="field-error">{errors.category}</span>}
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" value={values.date} onChange={set('date')} />
        {errors.date && <span className="field-error">{errors.date}</span>}
      </div>

      <div className="field">
        <span className="field-label">Paid with</span>
        <div className="chips" role="group" aria-label="Payment method">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`chip ${values.paymentMethod === m.value ? 'on' : ''}`}
              aria-pressed={values.paymentMethod === m.value}
              onClick={() => pick('paymentMethod', m.value)}
            >
              <Icon name={m.icon} size={16} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {accounts.length > 0 && (
        <div className="field">
          <span className="field-label">Account</span>
          <div className="chips" role="group" aria-label="Account">
            <button
              type="button"
              className={`chip ${values.account === '' ? 'on' : ''}`}
              aria-pressed={values.account === ''}
              onClick={() => pick('account', '')}
            >
              None
            </button>
            {accounts.map((a) => (
              <button
                key={a._id}
                type="button"
                className={`chip ${values.account === a._id ? 'on' : ''}`}
                aria-pressed={values.account === a._id}
                onClick={() => pick('account', a._id)}
              >
                <Icon name={accountTypeMeta(a.type).icon} size={16} />
                {a.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="note">
          Note <span className="muted">(optional, {values.note.length}/200)</span>
        </label>
        <textarea id="note" rows="2" value={values.note} onChange={set('note')} placeholder="What was this for?" />
        {errors.note && <span className="field-error">{errors.note}</span>}
      </div>

      {serverError && <div className="banner error" role="alert">{serverError}</div>}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className={`btn primary ${values.type}`} disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save changes' : `Add ${values.type}`}
        </button>
      </div>
    </form>
  );
}
