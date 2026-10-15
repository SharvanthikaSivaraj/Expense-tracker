import { useEffect, useRef, useState } from 'react';
import { accountTypeMeta, categoryMeta, CATEGORIES, PAYMENT_METHODS, toInputDate } from '../constants';
import { autoAccount, defaultMethod, eligibleFor, NO_ACCOUNT } from '../paymentRules';
import Icon from './Icon';

function initialValues(transaction, defaultDate, defaultType, accounts) {
  if (transaction) {
    const known = CATEGORIES[transaction.type].includes(transaction.category);
    return {
      amount: String(transaction.amount),
      type: transaction.type,
      category: known ? transaction.category : 'Other',
      customCategory: known ? '' : transaction.category,
      date: toInputDate(transaction.date),
      paymentMethod: transaction.paymentMethod,
      account: autoAccount(accounts, transaction.paymentMethod, transaction.account || ''),
      note: transaction.note || '',
    };
  }
  const method = defaultMethod(accounts);
  return {
    amount: '',
    type: defaultType,
    category: '',
    customCategory: '',
    date: defaultDate,
    paymentMethod: method,
    account: autoAccount(accounts, method),
    note: '',
  };
}

function validate(v, eligible) {
  const errors = {};
  const amount = Number(v.amount);
  if (v.amount === '' || Number.isNaN(amount) || amount <= 0) errors.amount = 'Enter an amount greater than 0';
  if (!v.category) errors.category = 'Choose a category';
  if (v.customCategory.length > 30) errors.customCategory = 'Keep it to 30 characters';
  if (!v.date) errors.date = 'Pick a date';
  if (v.note.length > 200) errors.note = 'Note must be 200 characters or fewer';
  if (v.paymentMethod !== 'cash') {
    if (eligible.length === 0) errors.account = (NO_ACCOUNT[v.paymentMethod] || NO_ACCOUNT.upi).text;
    else if (!v.account) errors.account = 'Choose which account this was paid from';
  }
  return errors;
}

export default function TransactionForm({
  transaction,
  accounts = [],
  defaultDate,
  defaultType,
  onAddAccount,
  onSave,
  onCancel,
}) {
  const [values, setValues] = useState(() => initialValues(transaction, defaultDate, defaultType, accounts));
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
    setValues((v) => ({
      ...v,
      type,
      category: CATEGORIES[type].includes(v.category) ? v.category : '',
      customCategory: CATEGORIES[type].includes(v.category) ? v.customCategory : '',
    }));

  const selectMethod = (method) =>
    setValues((v) => ({ ...v, paymentMethod: method, account: autoAccount(accounts, method) }));

  const method = values.paymentMethod;
  const needsAccount = method !== 'cash';
  const eligible = eligibleFor(accounts, method, values.account);
  const blocked = needsAccount && eligible.length === 0;
  // an old transaction may carry the retired "bank" method, keep it visible while editing
  const methods = method === 'bank' ? [...PAYMENT_METHODS, { value: 'bank', label: 'Bank', icon: 'bank' }] : PAYMENT_METHODS;

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values, eligible);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    // "Other" with a typed name is saved under that name
    const category = values.category === 'Other' && values.customCategory.trim() ? values.customCategory.trim() : values.category;

    setSaving(true);
    try {
      await onSave({
        amount: Number(values.amount),
        type: values.type,
        category,
        date: values.date,
        paymentMethod: values.paymentMethod,
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

        {values.category === 'Other' && (
          <div className="other-field">
            <input
              className="text-input"
              placeholder="Name it, e.g. Gym, Gift for mom (optional)"
              aria-label="Custom category name"
              maxLength={30}
              value={values.customCategory}
              onChange={set('customCategory')}
              autoFocus
            />
            {errors.customCategory && <span className="field-error">{errors.customCategory}</span>}
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" value={values.date} onChange={set('date')} />
        {errors.date && <span className="field-error">{errors.date}</span>}
      </div>

      <div className="field">
        <span className="field-label">Paid with</span>
        <div className="chips" role="group" aria-label="Payment method">
          {methods.map((m) => (
            <button
              key={m.value}
              type="button"
              className={`chip ${method === m.value ? 'on' : ''}`}
              aria-pressed={method === m.value}
              onClick={() => selectMethod(m.value)}
            >
              <Icon name={m.icon} size={16} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {blocked && (
        <div className="notice warn" role="alert">
          <Icon name="alert" size={20} />
          <div>
            <strong>{(NO_ACCOUNT[method] || NO_ACCOUNT.upi).title}</strong>
            <p>{(NO_ACCOUNT[method] || NO_ACCOUNT.upi).text}</p>
          </div>
          {onAddAccount && (
            <button type="button" className="btn small" onClick={onAddAccount}>
              Add account
            </button>
          )}
        </div>
      )}

      {eligible.length === 1 && (
        <div className="field">
          <span className="field-label">Account</span>
          <div className="auto-account">
            <Icon name={accountTypeMeta(eligible[0].type).icon} size={18} />
            <strong>{eligible[0].name}</strong>
            <span className="muted">selected automatically</span>
          </div>
        </div>
      )}

      {eligible.length > 1 && (
        <div className="field">
          <span className="field-label">Account</span>
          <div className="chips" role="group" aria-label="Account">
            {!needsAccount && (
              <button
                type="button"
                className={`chip ${values.account === '' ? 'on' : ''}`}
                aria-pressed={values.account === ''}
                onClick={() => pick('account', '')}
              >
                None
              </button>
            )}
            {eligible.map((a) => (
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
          {errors.account && <span className="field-error">{errors.account}</span>}
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
        <button
          type="submit"
          className={`btn primary ${values.type}`}
          disabled={saving || blocked}
          title={blocked ? 'Add an account to continue' : undefined}
        >
          {saving ? 'Saving...' : editing ? 'Save changes' : `Add ${values.type}`}
        </button>
      </div>
    </form>
  );
}
