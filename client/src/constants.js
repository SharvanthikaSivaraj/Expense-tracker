export const CATEGORIES = {
  expense: ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Other'],
};

export const CATEGORY_META = {
  Food: { color: '#e08a3c' },
  Transport: { color: '#3b82b6' },
  Rent: { color: '#6d7fcc' },
  Shopping: { color: '#c4638f' },
  Bills: { color: '#c9a227' },
  Health: { color: '#2fa58a' },
  Entertainment: { color: '#9a78c9' },
  Other: { color: '#7b8a85' },
  Salary: { color: '#2f9e6b' },
  Freelance: { color: '#3fb596' },
  Gift: { color: '#d9667a' },
};
export const categoryMeta = (c) => CATEGORY_META[c] || CATEGORY_META.Other;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
];

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const formatMoney = (n) => money.format(n);

const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCompact = (n) => `₹${compact.format(n)}`;

// Dates are stored in UTC, so always read them back in UTC
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const toInputDate = (iso) => new Date(iso).toISOString().slice(0, 10);

const pad = (n) => String(n).padStart(2, '0');

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const currentMonth = () => todayISO().slice(0, 7);

export const monthLabel = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const shiftMonth = (month, delta) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
};

export const daysInMonth = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

export const dayLabel = (isoDate) => {
  const today = todayISO();
  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (isoDate === today) return 'Today';
  if (isoDate === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
};

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
