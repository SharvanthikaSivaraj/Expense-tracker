import { useState } from 'react';
import { login, register } from '../api';
import { useAuth } from '../auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(isRegister, v) {
  const errors = {};
  if (isRegister && (v.name.trim().length < 2 || v.name.trim().length > 50)) {
    errors.name = 'Enter your name (2 to 50 characters)';
  }
  if (!EMAIL_RE.test(v.email.trim())) errors.email = 'Enter a valid email address';
  if (isRegister) {
    if (v.password.length < 8) errors.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) errors.password = 'Include a letter and a number';
  } else if (!v.password) {
    errors.password = 'Enter your password';
  }
  return errors;
}

export default function AuthPage() {
  const { authenticate, notice } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  function switchMode() {
    setIsRegister((r) => !r);
    setErrors({});
    setServerError('');
  }

  async function submit(e) {
    e.preventDefault();
    const found = validate(isRegister, values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      const body = { email: values.email.trim(), password: values.password };
      const result = isRegister ? await register({ ...body, name: values.name.trim() }) : await login(body);
      authenticate(result);
    } catch (err) {
      setServerError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <h1>Expense Tracker</h1>
      <h2>{isRegister ? 'Create an account' : 'Log in'}</h2>

      {notice && <p className="error">{notice}</p>}

      <form className="form" onSubmit={submit} noValidate>
        {isRegister && (
          <label>
            Name
            <input value={values.name} onChange={set('name')} autoComplete="name" />
            {errors.name && <span className="error">{errors.name}</span>}
          </label>
        )}

        <label>
          Email
          <input type="email" value={values.email} onChange={set('email')} autoComplete="email" autoFocus />
          {errors.email && <span className="error">{errors.email}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            value={values.password}
            onChange={set('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </label>

        {serverError && <p className="error">{serverError}</p>}

        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="muted">
        {isRegister ? 'Already have an account?' : 'New here?'}{' '}
        <button type="button" className="link" onClick={switchMode}>
          {isRegister ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </main>
  );
}
