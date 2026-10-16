import { useEffect } from 'react';

// A simple pop-up box that holds the transaction form
export default function Drawer({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <header className="drawer-head">
          <h2>{title}</h2>
          <button type="button" className="btn" onClick={onClose}>Close</button>
        </header>
        {children}
      </div>
    </div>
  );
}
