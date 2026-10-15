import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'et-theme-v4';
const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

function initialDark() {
  try {
    return localStorage.getItem(KEY) !== 'light'; // dark unless the user chose light
  } catch {
    return true;
  }
}

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try {
      localStorage.setItem(KEY, dark ? 'dark' : 'light');
    } catch {
      // ignore: the choice just will not persist
    }
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);
  const value = useMemo(() => ({ dark, toggle }), [dark, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
