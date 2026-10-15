import { useCallback, useState } from 'react';

// Monthly budget lives in this browser only (a per-viewer preference), keyed by user
export function useBudget(userId) {
  const key = `et-budget-${userId}`;

  const [budget, setBudget] = useState(() => {
    try {
      const n = Number(localStorage.getItem(key));
      return n > 0 ? n : 0;
    } catch {
      return 0;
    }
  });

  const save = useCallback(
    (n) => {
      setBudget(n);
      try {
        if (n > 0) localStorage.setItem(key, String(n));
        else localStorage.removeItem(key);
      } catch {
        // storage unavailable: budget just will not persist
      }
    },
    [key]
  );

  return [budget, save];
}
