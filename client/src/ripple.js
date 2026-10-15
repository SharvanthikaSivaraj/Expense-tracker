// Click ripple for buttons: one delegated listener, no per-component code
const TARGETS =
  '.btn, .glass-btn, .chip, .seg button, .type-switch button, .nav-list button, .nav-theme, .icon-btn, .nav-fab, .link-btn, .switch, .auth-tabs button';

export function installRipple() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = e.target.closest?.(TARGETS);
      if (!el || el.disabled) return;

      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      el.style.overflow = 'hidden';
      el.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    },
    { passive: true }
  );
}
