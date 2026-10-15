// Which accounts a payment method can use, and what the form should pre-select
import { METHOD_ACCOUNT_TYPES } from './constants';

export const NO_ACCOUNT = {
  card: { title: 'No card found', text: 'Add a credit or debit card in Accounts to pay with a card.' },
  upi: { title: 'No bank account found', text: 'Add a bank account or wallet in Accounts to pay with UPI.' },
};
NO_ACCOUNT.bank = NO_ACCOUNT.upi;

export const eligibleFor = (accounts, method, currentId = '') => {
  const types = METHOD_ACCOUNT_TYPES[method] || [];
  // keep the account an existing transaction already uses, even if it is an unusual match
  return accounts.filter((a) => types.includes(a.type) || a._id === currentId);
};

// Exactly one possible account is chosen for the user, otherwise they pick
export function autoAccount(accounts, method, currentId = '') {
  const eligible = eligibleFor(accounts, method, currentId);
  if (eligible.some((a) => a._id === currentId)) return currentId;
  return eligible.length === 1 ? eligible[0]._id : '';
}

// UPI if a bank account exists, otherwise card, otherwise cash
export function defaultMethod(accounts) {
  return ['upi', 'card'].find((m) => eligibleFor(accounts, m).length > 0) || 'cash';
}
