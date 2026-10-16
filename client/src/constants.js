export const CATEGORIES = {
  expense: ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'],
  income: ['Salary', 'Freelance', 'Gift', 'Other'],
};

export const PAYMENT_METHODS = ['cash', 'card', 'upi'];

export const formatMoney = (n) => '₹' + n.toLocaleString('en-IN');

// Dates are stored in UTC, so read them back in UTC
export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const toInputDate = (iso) => new Date(iso).toISOString().slice(0, 10);

export const today = () => new Date().toISOString().slice(0, 10);
export const currentMonth = () => today().slice(0, 7);
