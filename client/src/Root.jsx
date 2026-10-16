import { useEffect, useState } from 'react';
import { getMe } from './api';
import App from './App';
import AuthPage from './components/AuthPage';

// Shows the login page until we know who the user is
export default function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    if (!loading) return;
    getMe().then(setUser).catch(() => {}).finally(() => setLoading(false));
  }, [loading]);

  function handleLogin({ token, user }) {
    localStorage.setItem('token', token);
    setUser(user);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  if (loading) return <p>Loading...</p>;
  return user ? <App user={user} onLogout={handleLogout} /> : <AuthPage onLogin={handleLogin} />;
}
