import { useEffect, useRef, useState } from 'react';
import { ACCOUNT_COLORS, ACCOUNT_TYPES, NETWORKS, isCardType } from '../constants';
import Icon from './Icon';

function initialValues(account) {
  if (account) {
    return {
      name: account.name,
      type: account.type,
      openingBalance: String(account.openingBalance ?? 0),
      network: account.network || '',
      last4: account.last4 || '',
      expiry: account.expiry || '',
      creditLimit: account.creditLimit !== undefined ? String(account.creditLimit) : '',
      color: account.color || 'teal',
    };
  }
  return { name: '', type: 'bank', openingBalance: '', network: '', last4: '', expiry: '', creditLimit: '', color: 'teal' };
}

function validate(v) {
  const errors = {};
  if (!v.name.trim()) errors.name = 'Give the account a name';
  else if (v.name.trim().length > 40) errors.name = 'Name must be 40 characters or fewer';
  if (v.openingBalance !== '' && Number.isNaN(Number(v.openingBalance))) errors.openingBalance = 'Enter a number';
  if (isCardType(v.type)) {
    if (v.last4 && !/^\d{4}$/.test(v.last4)) errors.last4 = 'Enter exactly 4 digits';
    if (v.expiry && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(v.expiry)) errors.expiry = 'Use MM/YY';
    if (v.type === 'credit_card' && v.creditLimit !== '' && (Number.isNaN(Number(v.creditLimit)) || Number(v.creditLimit) < 0)) {
      errors.creditLimit = 'Enter a limit of 0 or more';
    }
  }
  return errors;
}

export default function AccountForm({ account, onSave, onCancel }) {
  const [values, setValues] = useState(() => initialValues(account));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);
  const editing = Boolean(account);
  const card = isCardType(values.type);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));
  const pick = (field, value) => setValues((v) => ({ ...v, [field]: value }));

  // Keep expiry typed as MM/YY
  const setExpiry = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    pick('expiry', digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
  };

  async function submit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    const body = {
      name: values.name.trim(),
      type: values.type,
      openingBalance: values.openingBalance === '' ? 0 : Number(values.openingBalance),
      color: values.color,
    };
    if (card) {
      body.network = values.network;
      body.last4 = values.last4;
      body.expiry = values.expiry;
      if (values.type === 'credit_card' && values.creditLimit !== '') body.creditLimit = Number(values.creditLimit);
    }

    setSaving(true);
    try {
      await onSave(body);
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="acct-name">Account name</label>
        <input
          id="acct-name"
          ref={nameRef}
          className="text-input"
          placeholder="e.g. HDFC Savings"
          value={values.name}
          onChange={set('name')}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="field">
        <span className="field-label">Type</span>
        <div className="chips" role="group" aria-label="Account type">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`chip ${values.type === t.value ? 'on' : ''}`}
              aria-pressed={values.type === t.value}
              onClick={() => pick('type', t.value)}
            >
              <Icon name={t.icon} size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="acct-opening">Opening balance</label>
        <div className="amount-input income">
          <span>₹</span>
          <input
            id="acct-opening"
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0"
            value={values.openingBalance}
            onChange={set('openingBalance')}
          />
        </div>
        <span className="muted hint">
          {values.type === 'credit_card' ? 'Usually 0. Spending will show as outstanding.' : 'What the account holds today.'}
        </span>
        {errors.openingBalance && <span className="field-error">{errors.openingBalance}</span>}
      </div>

      {card && (
        <>
          <div className="field">
            <span className="field-label">Network</span>
            <div className="chips" role="group" aria-label="Card network">
              {NETWORKS.map((n) => (
                <button
                  key={n.value}
                  type="button"
                  className={`chip ${values.network === n.value ? 'on' : ''}`}
                  aria-pressed={values.network === n.value}
                  onClick={() => pick('network', values.network === n.value ? '' : n.value)}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="acct-last4">Last 4 digits</label>
              <input
                id="acct-last4"
                className="text-input"
                inputMode="numeric"
                maxLength={4}
                placeholder="4242"
                value={values.last4}
                onChange={(e) => pick('last4', e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              {errors.last4 && <span className="field-error">{errors.last4}</span>}
            </div>
            <div className="field">
              <label htmlFor="acct-expiry">Expiry</label>
              <input
                id="acct-expiry"
                className="text-input"
                inputMode="numeric"
                placeholder="MM/YY"
                value={values.expiry}
                onChange={setExpiry}
              />
              {errors.expiry && <span className="field-error">{errors.expiry}</span>}
            </div>
          </div>

          {values.type === 'credit_card' && (
            <div className="field">
              <label htmlFor="acct-limit">Credit limit</label>
              <input
                id="acct-limit"
                className="text-input"
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="e.g. 100000"
                value={values.creditLimit}
                onChange={set('creditLimit')}
              />
              {errors.creditLimit && <span className="field-error">{errors.creditLimit}</span>}
            </div>
          )}

          <p className="muted hint">Only the last 4 digits are stored. Never enter a full card number or CVV.</p>
        </>
      )}

      <div className="field">
        <span className="field-label">Color</span>
        <div className="swatches" role="group" aria-label="Card color">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch acct-${c} ${values.color === c ? 'on' : ''}`}
              aria-label={c}
              aria-pressed={values.color === c}
              onClick={() => pick('color', c)}
            />
          ))}
        </div>
      </div>

      {serverError && <div className="banner error" role="alert">{serverError}</div>}

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Add account'}
        </button>
      </div>
    </form>
  );
}
