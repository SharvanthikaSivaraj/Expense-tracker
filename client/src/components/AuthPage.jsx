import { useState } from 'react';
import { login, register } from '../api';

export default function AuthPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const set = (field) => (e) => setValues({ ...values, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    try {
      onLogin(await (isRegister ? register(values) : login(values)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="auth" onSubmit={submit}>
      <h1>Expense Tracker</h1>
      <h2>{isRegister ? 'Sign up' : 'Log in'}</h2>
      {isRegister && <input placeholder="Name" value={values.name} onChange={set('name')} />}
      <input type="email" placeholder="Email" value={values.email} onChange={set('email')} />
      <input type="password" placeholder="Password" value={values.password} onChange={set('password')} />
      {isRegister && <small>At least 8 characters, with a letter and a number.</small>}
      {error && <p className="error">{error}</p>}
      <button>{isRegister ? 'Create account' : 'Log in'}</button>
      <p>
        {isRegister ? 'Have an account? ' : 'New here? '}
        <a href="#" onClick={(e) => { e.preventDefault(); setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Log in' : 'Sign up'}
        </a>
      </p>
    </form>
  );
}
