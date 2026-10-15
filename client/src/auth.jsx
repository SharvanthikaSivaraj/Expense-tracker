import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (api.getToken() ? 'loading' : 'anon')); // loading | authed | anon
  const [notice, setNotice] = useState('');

  const logout = useCallback((message = '') => {
    api.setToken(null);
    setUser(null);
    setStatus('anon');
    setNotice(message);
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(() => logout('Your session expired. Please log in again.'));
  }, [logout]);

  // Restore the session from a saved token
  useEffect(() => {
    if (!api.getToken()) return undefined;
    let cancelled = false;
    api
      .getMe()
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus('authed');
      })
      .catch((err) => {
        if (cancelled || err.status === 401) return; // 401 is handled by the interceptor
        setStatus('anon');
        setNotice(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = useCallback(({ token, user: me }, remember = true) => {
    api.setToken(token, remember);
    setUser(me);
    setStatus('authed');
    setNotice('');
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      notice,
      setUser,
      authenticate,
      logout: () => logout(),
    }),
    [user, status, notice, authenticate, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
