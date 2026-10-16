import { useState } from 'react';
import { CATEGORIES, PAYMENT_METHODS, toInputDate } from '../constants';

export default function TransactionForm({ transaction, defaultDate, onSave, onCancel }) {
  const [values, setValues] = useState({
    type: transaction?.type || 'expense',
    amount: transaction?.amount || '',
    category: transaction?.category || '',
    date: transaction ? toInputDate(transaction.date) : defaultDate,
    paymentMethod: transaction?.paymentMethod || 'cash',
    note: transaction?.note || '',
  });
  const [error, setError] = useState('');

  const set = (field) => (e) => setValues({ ...values, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!(Number(values.amount) > 0)) return setError('Enter an amount greater than 0');
    if (!values.category) return setError('Choose a category');
    try {
      await onSave({ ...values, amount: Number(values.amount) });
    } catch (err) {
      setError(err.message);
    }
  }

  // Keep the old category selectable when editing one that is not in the list
  const categories = [...new Set([...CATEGORIES[values.type], values.category].filter(Boolean))];

  return (
    <form onSubmit={submit}>
      <select value={values.type} onChange={(e) => setValues({ ...values, type: e.target.value, category: '' })}>
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>
      <input type="number" placeholder="Amount" step="0.01" value={values.amount} onChange={set('amount')} />
      <select value={values.category} onChange={set('category')}>
        <option value="">Category</option>
        {categories.map((c) => <option key={c}>{c}</option>)}
      </select>
      <input type="date" value={values.date} onChange={set('date')} />
      <select value={values.paymentMethod} onChange={set('paymentMethod')}>
        {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
      </select>
      <input placeholder="Note (optional)" maxLength="200" value={values.note} onChange={set('note')} />
      <button>{transaction ? 'Save' : 'Add'}</button>
      <button type="button" onClick={onCancel}>Cancel</button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
