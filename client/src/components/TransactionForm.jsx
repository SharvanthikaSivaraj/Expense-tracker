import { useState } from 'react';
import { CATEGORIES, PAYMENT_METHODS, toInputDate } from '../constants';

function initialValues(transaction, defaultDate, defaultType) {
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
  return { amount: '', type: defaultType, category: '', date: defaultDate, paymentMethod: 'cash', note: '' };
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

export default function TransactionForm({ transaction, defaultDate, defaultType, onSave, onCancel }) {
  const [values, setValues] = useState(() => initialValues(transaction, defaultDate, defaultType));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  // Changing between income and expense changes the category list
  const setType = (e) => setValues((v) => ({ ...v, type: e.target.value, category: '' }));

  // An old transaction may use a category that is not in the list, so keep it selectable
  const categories = CATEGORIES[values.type].includes(values.category) || !values.category
    ? CATEGORIES[values.type]
    : [...CATEGORIES[values.type], values.category];

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      await onSave({
        amount: Number(values.amount),
        type: values.type,
        category: values.category,
        date: values.date,
        paymentMethod: values.paymentMethod,
        note: values.note.trim(),
      });
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label>
        Type
        <select value={values.type} onChange={setType}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </label>

      <label>
        Amount
        <input type="number" step="0.01" min="0" value={values.amount} onChange={set('amount')} autoFocus />
        {errors.amount && <span className="error">{errors.amount}</span>}
      </label>

      <label>
        Category
        <select value={values.category} onChange={set('category')}>
          <option value="">Choose...</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {errors.category && <span className="error">{errors.category}</span>}
      </label>

      <label>
        Date
        <input type="date" value={values.date} onChange={set('date')} />
        {errors.date && <span className="error">{errors.date}</span>}
      </label>

      <label>
        Paid with
        <select value={values.paymentMethod} onChange={set('paymentMethod')}>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
          {values.paymentMethod === 'bank' && <option value="bank">Bank</option>}
        </select>
      </label>

      <label>
        Note (optional)
        <textarea rows="2" value={values.note} onChange={set('note')} />
        {errors.note && <span className="error">{errors.note}</span>}
      </label>

      {serverError && <p className="error">{serverError}</p>}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving...' : transaction ? 'Save changes' : 'Add'}
        </button>
      </div>
    </form>
  );
}
