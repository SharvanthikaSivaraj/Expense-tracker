export const CATEGORIES = {
  expense: ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Other'],
};

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank', label: 'Bank' },
];

const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export const formatMoney = (n) => money.format(n);

// Dates are stored in UTC, so always read them back in UTC
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const toInputDate = (iso) => new Date(iso).toISOString().slice(0, 10);

export const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
