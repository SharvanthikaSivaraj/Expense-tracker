export const CATEGORIES = {
  expense: ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Other'],
};

export const CATEGORY_META = {
  Food: { icon: 'food', color: '#e08a3c' },
  Transport: { icon: 'bus', color: '#3b82b6' },
  Rent: { icon: 'home', color: '#6d7fcc' },
  Shopping: { icon: 'bag', color: '#c4638f' },
  Bills: { icon: 'bolt', color: '#c9a227' },
  Health: { icon: 'heart', color: '#2fa58a' },
  Entertainment: { icon: 'film', color: '#9a78c9' },
  Other: { icon: 'dots', color: '#7b8a85' },
  Salary: { icon: 'briefcase', color: '#2f9e6b' },
  Freelance: { icon: 'laptop', color: '#3fb596' },
  Gift: { icon: 'gift', color: '#d9667a' },
};
export const categoryMeta = (c) => CATEGORY_META[c] || CATEGORY_META.Other;

// What the form offers. 'bank' is no longer selectable (a card or UPI payment already covers it)
// but older transactions can still carry it, so ALL_PAYMENT_METHODS is used when displaying.
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: 'cash' },
  { value: 'card', label: 'Card', icon: 'card' },
  { value: 'upi', label: 'UPI', icon: 'phone' },
];
export const ALL_PAYMENT_METHODS = [...PAYMENT_METHODS, { value: 'bank', label: 'Bank', icon: 'bank' }];

// Which kind of account can pay with each method
export const METHOD_ACCOUNT_TYPES = {
  cash: ['cash'],
  card: ['credit_card', 'debit_card'],
  upi: ['bank', 'wallet'],
  bank: ['bank', 'wallet'],
};

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank', icon: 'bank' },
  { value: 'cash', label: 'Cash', icon: 'cash' },
  { value: 'wallet', label: 'Wallet', icon: 'wallet' },
  { value: 'credit_card', label: 'Credit card', icon: 'card' },
  { value: 'debit_card', label: 'Debit card', icon: 'card' },
];
export const accountTypeMeta = (type) => ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[0];
export const isCardType = (type) => type === 'credit_card' || type === 'debit_card';

export const NETWORKS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'rupay', label: 'RuPay' },
  { value: 'amex', label: 'Amex' },
  { value: 'other', label: 'Other' },
];
export const networkLabel = (value) => NETWORKS.find((n) => n.value === value)?.label || '';
export const ACCOUNT_COLORS = ['teal', 'indigo', 'amber', 'rose', 'slate'];

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

// Whole days from today until an ISO date (negative when past)
export const daysUntil = (iso) =>
  Math.round((Date.parse(`${toInputDate(iso)}T00:00:00Z`) - Date.parse(`${todayISO()}T00:00:00Z`)) / 86400000);

export function dueInfo(iso) {
  const d = daysUntil(iso);
  if (d < 0) return { label: `Overdue by ${-d} day${d === -1 ? '' : 's'}`, tone: 'bad' };
  if (d === 0) return { label: 'Due today', tone: 'warn' };
  if (d === 1) return { label: 'Due tomorrow', tone: 'warn' };
  return { label: `In ${d} days`, tone: d <= 7 ? 'warn' : 'ok' };
}
