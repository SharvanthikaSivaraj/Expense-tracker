import { useState } from 'react';
import { CATEGORIES, PAYMENT_METHODS, toInputDate } from '../constants';

function initialValues(transaction, defaultDate) {
  if (transaction) {
    return {
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      date: toInputDate(transaction.date),
      paymentMethod: transaction.paymentMethod,
      note: transaction.note || '',
    };
  }
  return { amount: '', type: 'expense', category: '', date: defaultDate, paymentMethod: 'upi', note: '' };
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

export default function TransactionForm({ transaction, defaultDate, onSave, onCancel }) {
  const [values, setValues] = useState(() => initialValues(transaction, defaultDate));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(transaction);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

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
      await onSave({ ...values, amount: Number(values.amount), note: values.note.trim() });
      if (!editing) setValues(initialValues(null, values.date));
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <h2>{editing ? 'Edit transaction' : 'Add transaction'}</h2>

      <div className="type-toggle" role="group" aria-label="Type">
        {['expense', 'income'].map((t) => (
          <button
            key={t}
            type="button"
            className={values.type === t ? `active ${t}` : ''}
            onClick={() => setType(t)}
          >
            {t === 'expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      <label>
        Amount
        <input type="number" inputMode="decimal" step="0.01" value={values.amount} onChange={set('amount')} placeholder="0.00" />
        {errors.amount && <span className="field-error">{errors.amount}</span>}
      </label>

      <label>
        Category
        <select value={values.category} onChange={set('category')}>
          <option value="">Select category</option>
          {CATEGORIES[values.type].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && <span className="field-error">{errors.category}</span>}
      </label>

      <label>
        Date
        <input type="date" value={values.date} onChange={set('date')} />
        {errors.date && <span className="field-error">{errors.date}</span>}
      </label>

      <label>
        Payment method
        <select value={values.paymentMethod} onChange={set('paymentMethod')}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </label>

      <label>
        Note <span className="muted">(optional, {values.note.length}/200)</span>
        <textarea rows="2" value={values.note} onChange={set('note')} />
        {errors.note && <span className="field-error">{errors.note}</span>}
      </label>

      {serverError && <div className="banner error">{serverError}</div>}

      <div className="form-actions">
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Add transaction'}
        </button>
        {editing && (
          <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
        )}
      </div>
    </form>
  );
}
