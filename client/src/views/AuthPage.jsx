import { useState } from 'react';
import { login as apiLogin, register as apiRegister } from '../api';
import { useAuth } from '../auth';
import Icon from '../components/Icon';
import { useTheme } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

function strengthOf(pw) {
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score += 1;
  return pw ? score : 0;
}

function validate(mode, v) {
  const errors = {};
  if (mode === 'register' && (v.name.trim().length < 2 || v.name.trim().length > 50)) {
    errors.name = 'Enter your name (2 to 50 characters)';
  }
  if (!EMAIL_RE.test(v.email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (mode === 'register') {
    if (v.password.length < 8) errors.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) errors.password = 'Include a letter and a number';
    if (v.confirm !== v.password) errors.confirm = 'Passwords do not match';
  } else if (!v.password) {
    errors.password = 'Enter your password';
  }
  return errors;
}

function Field({ id, label, icon, error, valid, trailing, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`input-wrap ${error ? 'invalid' : ''}`}>
        <span className="lead"><Icon name={icon} size={18} /></span>
        {children}
        {trailing || (valid && <span className="trail valid-mark"><Icon name="check" size={18} /></span>)}
      </div>
      {error && (
        <span className="field-error with-icon">
          <Icon name="alert" size={14} /> {error}
        </span>
      )}
    </div>
  );
}

export default function AuthPage() {
  const { authenticate, notice } = useAuth();
  const { dark, toggle } = useTheme();
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const score = strengthOf(values.password);

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }));
    if (serverError) setServerError('');
  };

  function switchMode(next) {
    if (next === mode) return;
    setMode(next);
    setErrors({});
    setServerError('');
    setShowPassword(false);
  }

  function fail(message) {
    setServerError(message);
    setBusy(false);
  }

  // Runs the request, then hands the session to the app
  async function enter(request, body) {
    setBusy(true);
    try {
      const result = await request(body);
      authenticate(result, remember);
    } catch (err) {
      fail(err.message);
    }
  }

  function submit(e) {
    e.preventDefault();
    const found = validate(mode, values);
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length) return;
    const body = { email: values.email.trim(), password: values.password };
    if (isRegister) enter(apiRegister, { ...body, name: values.name.trim() });
    else enter(apiLogin, body);
  }

  const detectCaps = (e) => setCapsLock(e.getModifierState?.('CapsLock') ?? false);

  const passwordToggle = (
    <button
      type="button"
      className="icon-btn trail"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      aria-pressed={showPassword}
      onClick={() => setShowPassword((s) => !s)}
    >
      <Icon name="eye" size={18} />
    </button>
  );

  return (
    <div className="auth">
      <aside className="auth-hero">
        <div className="brand">
          <span className="logo" aria-hidden="true">₹</span>
          <span className="brand-name">Expense Tracker</span>
        </div>

        <div className="auth-copy" key={mode}>
          <h1>{isRegister ? 'Start in a minute.' : 'Welcome back.'}</h1>
          <p>
            {isRegister
              ? 'Set a budget, log your spending and see exactly where the month goes.'
              : 'Your month at a glance, right where you left it.'}
          </p>
        </div>
      </aside>

      <main className="auth-panel">
        <button
          type="button"
          className="icon-btn theme-float"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggle}
        >
          <Icon name={dark ? 'sun' : 'moon'} size={20} />
        </button>

        <div className="auth-card">
              <div className="auth-tabs" data-mode={mode} role="tablist" aria-label="Log in or create an account">
                <span className="thumb" />
                <button type="button" role="tab" aria-selected={!isRegister} className={!isRegister ? 'on' : ''} onClick={() => switchMode('login')}>
                  Log in
                </button>
                <button type="button" role="tab" aria-selected={isRegister} className={isRegister ? 'on' : ''} onClick={() => switchMode('register')}>
                  Sign up
                </button>
              </div>

              <div className="auth-title" key={`t-${mode}`}>
                <h2>{isRegister ? 'Create your account' : 'Log in to your account'}</h2>
                <p className="muted">
                  {isRegister ? 'It takes less than a minute.' : 'Enter your details to continue.'}
                </p>
              </div>

              {notice && (
                <div className="banner error" role="alert">
                  <span>{notice}</span>
                </div>
              )}

              <form
                className="form auth-form"
                onSubmit={submit}
                noValidate
              >
                {isRegister && (
                  <Field id="name" label="Full name" icon="user" error={errors.name} valid={values.name.trim().length >= 2}>
                    <input id="name" className="text-input" autoComplete="name" placeholder="Your name" value={values.name} onChange={set('name')} />
                  </Field>
                )}

                <Field id="email" label="Email" icon="mail" error={errors.email} valid={EMAIL_RE.test(values.email.trim())}>
                  <input
                    id="email"
                    className="text-input"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    autoFocus
                    value={values.email}
                    onChange={set('email')}
                  />
                </Field>

                <Field id="password" label="Password" icon="lock" error={errors.password} trailing={passwordToggle}>
                  <input
                    id="password"
                    className="text-input"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
                    value={values.password}
                    onChange={set('password')}
                    onKeyUp={detectCaps}
                    onKeyDown={detectCaps}
                    onBlur={() => setCapsLock(false)}
                  />
                </Field>

                {capsLock && (
                  <span className="caps-warning">
                    <Icon name="alert" size={14} /> Caps Lock is on
                  </span>
                )}

                {isRegister && (
                  <div className="strength-block">
                    <div className="strength" data-s={score}>
                      <i /><i /><i /><i />
                    </div>
                    <small className="muted">
                      {values.password ? `Password strength: ${STRENGTH_LABELS[score]}` : 'Use 8+ characters with a letter and a number'}
                    </small>
                  </div>
                )}

                {isRegister && (
                  <Field
                    id="confirm"
                    label="Confirm password"
                    icon="lock"
                    error={errors.confirm}
                    valid={values.confirm !== '' && values.confirm === values.password}
                  >
                    <input
                      id="confirm"
                      className="text-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={values.confirm}
                      onChange={set('confirm')}
                    />
                  </Field>
                )}

                {!isRegister && (
                  <label className="check">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span className="box"><Icon name="check" size={13} /></span>
                    Keep me logged in on this device
                  </label>
                )}

                {serverError && (
                  <div className="banner error" role="alert">
                    <span>{serverError}</span>
                  </div>
                )}

                <button type="submit" className="btn primary block submit" disabled={busy}>
                  {busy ? (
                    <span className="spinner on-primary" aria-label="Please wait" />
                  ) : (
                    <>
                      {isRegister ? 'Create account' : 'Log in'}
                      <Icon name="arrowRight" size={18} />
                    </>
                  )}
                </button>
              </form>

              <p className="auth-switch muted">
                {isRegister ? 'Already have an account?' : 'New here?'}{' '}
                <button type="button" className="link-btn" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
                  {isRegister ? 'Log in' : 'Create an account'}
                </button>
              </p>
        </div>
      </main>
    </div>
  );
}
