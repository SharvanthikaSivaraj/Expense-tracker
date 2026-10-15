// A browser-only stand-in for the Express API, backed by localStorage.
// It mirrors the real API's responses and validation so the UI cannot tell the difference.
// Data is per browser; clearing site data resets it.
import { getToken, notifyUnauthorized } from './token';

const DB_KEY = 'et-mock-db';
const DELAY = 220;

export const DEMO_ACCOUNT = { email: 'demo@expensetracker.dev', password: 'Demo1234', name: 'Demo User' };

const CATEGORIES_OK = (v) => typeof v === 'string' && v.trim().length > 0;
const TYPES = ['income', 'expense'];
const METHODS = ['cash', 'card', 'upi', 'bank'];
const ACCOUNT_TYPES = ['bank', 'cash', 'wallet', 'credit_card', 'debit_card'];
const NETWORKS = ['visa', 'mastercard', 'rupay', 'amex', 'other'];
const COLORS = ['teal', 'indigo', 'amber', 'rose', 'slate'];

const wait = (ms = DELAY) => new Promise((r) => setTimeout(r, ms));

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function hash(text) {
  const bytes = new TextEncoder().encode(`et-mock:${text}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const nowISO = () => new Date().toISOString();
const publicUser = ({ passwordHash, ...rest }) => rest; // eslint-disable-line no-unused-vars

// ---------- storage ----------
function demoAccounts(userId) {
  const base = { user: userId, createdAt: nowISO(), updatedAt: nowISO() };
  return [
    { ...base, _id: crypto.randomUUID(), name: 'HDFC Savings', type: 'bank', openingBalance: 25000, color: 'teal' },
    { ...base, _id: crypto.randomUUID(), name: 'Cash wallet', type: 'cash', openingBalance: 2000, color: 'amber' },
    {
      ...base,
      _id: crypto.randomUUID(),
      name: 'ICICI Credit Card',
      type: 'credit_card',
      network: 'visa',
      last4: '4242',
      expiry: '08/29',
      creditLimit: 100000,
      openingBalance: 0,
      color: 'indigo',
    },
    {
      ...base,
      _id: crypto.randomUUID(),
      name: 'Axis Debit Card',
      type: 'debit_card',
      network: 'mastercard',
      last4: '1881',
      expiry: '03/28',
      openingBalance: 5000,
      color: 'slate',
    },
  ];
}

// Gives the demo user accounts and links their sample transactions by payment method
function attachDemoAccounts(db, userId) {
  const accounts = demoAccounts(userId);
  const byName = Object.fromEntries(accounts.map((a) => [a.name, a._id]));
  const map = { bank: 'HDFC Savings', upi: 'HDFC Savings', cash: 'Cash wallet', card: 'ICICI Credit Card' };
  db.accounts = accounts;
  for (const t of db.transactions) {
    if (t.user === userId && t.account === undefined) t.account = byName[map[t.paymentMethod]] || null;
  }
}
function demoTransactions(userId) {
  const now = new Date();
  const cur = { y: now.getUTCFullYear(), m: now.getUTCMonth() };
  const prev = cur.m === 0 ? { y: cur.y - 1, m: 11 } : { y: cur.y, m: cur.m - 1 };
  const rows = [
    [50000, 'income', 'Salary', 1, 'bank', 'Monthly salary'],
    [8000, 'expense', 'Rent', 2, 'bank', 'Room rent'],
    [450, 'expense', 'Food', 4, 'upi', 'Lunch with friends'],
    [1200, 'expense', 'Bills', 6, 'upi', 'Electricity and internet'],
    [300, 'expense', 'Transport', 8, 'cash', 'Metro card recharge'],
    [2500, 'expense', 'Shopping', 11, 'card', 'New shoes'],
    [5000, 'income', 'Freelance', 13, 'upi', 'Website project'],
    [600, 'expense', 'Entertainment', 15, 'card', 'Movie and snacks'],
    [350, 'expense', 'Health', 18, 'cash', 'Pharmacy'],
    [900, 'expense', 'Food', 21, 'upi', 'Groceries'],
  ];
  return [prev, cur].flatMap((month) =>
    rows.map(([amount, type, category, d, paymentMethod, note]) => ({
      _id: crypto.randomUUID(),
      user: userId,
      amount,
      type,
      category,
      date: new Date(Date.UTC(month.y, month.m, d)).toISOString(),
      paymentMethod,
      note,
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }))
  );
}

async function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      if (!db.accounts) {
        // database created before accounts existed: add them for the demo user
        const demo = db.users.find((u) => u.email === DEMO_ACCOUNT.email);
        db.accounts = [];
        if (demo) attachDemoAccounts(db, demo._id);
        save(db);
      }
      return db;
    }
  } catch {
    // fall through and rebuild
  }
  const id = crypto.randomUUID();
  const db = {
    users: [
      {
        _id: id,
        name: DEMO_ACCOUNT.name,
        email: DEMO_ACCOUNT.email,
        passwordHash: await hash(DEMO_ACCOUNT.password),
        createdAt: nowISO(),
        updatedAt: nowISO(),
      },
    ],
    transactions: demoTransactions(id),
  };
  attachDemoAccounts(db, id);
  save(db);
  return db;
}

function save(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    throw httpError(500, 'Browser storage is unavailable, so demo data cannot be saved');
  }
}

// Resolves the logged-in user or behaves like an expired session
async function authed() {
  const db = await load();
  const user = db.users.find((u) => u._id === getToken());
  if (!user) {
    notifyUnauthorized();
    throw httpError(401, 'Session expired. Please log in again');
  }
  return { db, user };
}

// ---------- validation (same rules as the server) ----------
function passwordProblem(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password cannot exceed 72 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Password must contain a letter and a number';
  return null;
}

function nameProblem(name) {
  const n = typeof name === 'string' ? name.trim() : '';
  if (n.length < 2) return 'Name must be at least 2 characters';
  if (n.length > 50) return 'Name cannot exceed 50 characters';
  return null;
}

function transactionFrom(body) {
  const errors = [];
  const amount = Number(body.amount);
  if (body.amount === '' || body.amount === undefined || Number.isNaN(amount)) errors.push('Amount is required');
  else if (amount < 0.01) errors.push('Amount must be at least 0.01');
  if (!TYPES.includes(body.type)) errors.push('Type must be income or expense');
  if (!CATEGORIES_OK(body.category)) errors.push('Category is required');
  const date = new Date(body.date);
  if (!body.date || Number.isNaN(date.getTime())) errors.push('Date is required');
  if (!METHODS.includes(body.paymentMethod)) errors.push('Payment method must be cash, card, upi or bank');
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  if (note.length > 200) errors.push('Note cannot exceed 200 characters');
  if (errors.length) throw httpError(400, errors.join(', '));

  return {
    amount,
    type: body.type,
    category: body.category.trim(),
    date: date.toISOString(),
    paymentMethod: body.paymentMethod,
    note: note || undefined,
  };
}

function monthRange(month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) return null;
  const [y, m] = month.split('-').map(Number);
  return { start: Date.UTC(y, m - 1, 1), end: Date.UTC(y, m, 1) };
}

const inRange = (t, range) => {
  const time = new Date(t.date).getTime();
  return time >= range.start && time < range.end;
};

// ---------- auth ----------
export async function register({ name, email, password }) {
  await wait();
  const db = await load();
  const nameErr = nameProblem(name);
  if (nameErr) throw httpError(400, nameErr);
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw httpError(400, 'Enter a valid email address');
  }
  const passErr = passwordProblem(password);
  if (passErr) throw httpError(400, passErr);

  const clean = email.trim().toLowerCase();
  if (db.users.some((u) => u.email === clean)) {
    throw httpError(409, 'An account with this email already exists');
  }
  const user = {
    _id: crypto.randomUUID(),
    name: name.trim(),
    email: clean,
    passwordHash: await hash(password),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  db.users.push(user);
  save(db);
  return { token: user._id, user: publicUser(user) };
}

export async function login({ email, password }) {
  await wait();
  const db = await load();
  const user = db.users.find((u) => u.email === String(email).trim().toLowerCase());
  if (!user || user.passwordHash !== (await hash(String(password)))) {
    throw httpError(401, 'Invalid email or password');
  }
  return { token: user._id, user: publicUser(user) };
}

export async function getMe() {
  await wait(80);
  const { user } = await authed();
  return publicUser(user);
}

export async function updateProfile(name) {
  await wait();
  const { db, user } = await authed();
  const problem = nameProblem(name);
  if (problem) throw httpError(400, problem);
  user.name = name.trim();
  user.updatedAt = nowISO();
  save(db);
  return publicUser(user);
}

export async function changePassword({ currentPassword, newPassword }) {
  await wait();
  const { db, user } = await authed();
  if (user.passwordHash !== (await hash(String(currentPassword)))) {
    throw httpError(400, 'Current password is incorrect');
  }
  const problem = passwordProblem(newPassword);
  if (problem) throw httpError(400, problem);
  user.passwordHash = await hash(newPassword);
  save(db);
  return { message: 'Password updated' };
}

export async function deleteMe(password) {
  await wait();
  const { db, user } = await authed();
  if (user.passwordHash !== (await hash(String(password)))) throw httpError(400, 'Password is incorrect');
  db.users = db.users.filter((u) => u._id !== user._id);
  db.transactions = db.transactions.filter((t) => t.user !== user._id);
  db.accounts = db.accounts.filter((a) => a.user !== user._id);
  save(db);
  return { message: 'Account deleted' };
}

// ---------- transactions ----------
export async function getTransactions(month) {
  await wait();
  const { db, user } = await authed();
  const range = month === undefined ? null : monthRange(month);
  if (month !== undefined && !range) throw httpError(400, 'month must be in YYYY-MM format');
  return db.transactions
    .filter((t) => t.user === user._id && (!range || inRange(t, range)))
    .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getSummary(month) {
  await wait();
  const { db, user } = await authed();
  const range = monthRange(month);
  if (!range) throw httpError(400, 'month is required in YYYY-MM format');

  const list = db.transactions.filter((t) => t.user === user._id && inRange(t, range));
  const sum = (type) => list.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  const income = sum('income');
  const expense = sum('expense');

  const totals = new Map();
  for (const t of list) if (t.type === 'expense') totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
  const byCategory = [...totals.entries()]
    .map(([_id, total]) => ({ _id, total }))
    .sort((a, b) => b.total - a.total);

  return { income, expense, balance: income - expense, byCategory };
}

// '' / null unlink, an id must belong to the caller. Returns { present, value }.
function accountLink(db, user, body) {
  if (!('account' in body)) return { present: false };
  if (body.account === '' || body.account === null) return { present: true, value: null };
  if (!db.accounts.some((a) => a._id === body.account && a.user === user._id)) {
    throw httpError(400, 'Account not found');
  }
  return { present: true, value: body.account };
}

export async function createTransaction(body) {
  await wait();
  const { db, user } = await authed();
  const input = body || {};
  const link = accountLink(db, user, input);
  const t = {
    _id: crypto.randomUUID(),
    user: user._id,
    ...transactionFrom(input),
    account: link.present ? link.value : null,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  db.transactions.push(t);
  save(db);
  return t;
}

export async function updateTransaction(id, body) {
  await wait();
  const { db, user } = await authed();
  const existing = db.transactions.find((t) => t._id === id && t.user === user._id);
  if (!existing) throw httpError(404, 'Transaction not found');
  const input = body || {};
  const link = accountLink(db, user, input);
  Object.assign(existing, transactionFrom(input), { updatedAt: nowISO() });
  if (link.present) existing.account = link.value;
  save(db);
  return existing;
}

export async function deleteTransaction(id) {
  await wait();
  const { db, user } = await authed();
  const index = db.transactions.findIndex((t) => t._id === id && t.user === user._id);
  if (index === -1) throw httpError(404, 'Transaction not found');
  db.transactions.splice(index, 1);
  save(db);
  return { message: 'Deleted' };
}

// ---------- accounts ----------
const CARD_FIELDS = ['network', 'last4', 'expiry', 'creditLimit'];

function accountFrom(body) {
  const input = body && typeof body === 'object' ? body : {};
  const errors = [];

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) errors.push('Account name is required');
  else if (name.length > 40) errors.push('Account name cannot exceed 40 characters');

  if (!ACCOUNT_TYPES.includes(input.type)) errors.push('Type must be bank, cash, wallet, credit_card or debit_card');

  const opening = input.openingBalance === '' || input.openingBalance === undefined ? 0 : Number(input.openingBalance);
  if (Number.isNaN(opening)) errors.push('Opening balance must be a number');

  const out = { name, type: input.type, openingBalance: opening, color: COLORS.includes(input.color) ? input.color : 'teal' };
  if (input.color !== undefined && input.color !== '' && !COLORS.includes(input.color)) errors.push('Unknown color');

  const isCard = input.type === 'credit_card' || input.type === 'debit_card';
  if (isCard) {
    if (input.network) {
      if (!NETWORKS.includes(input.network)) errors.push('Unknown card network');
      else out.network = input.network;
    }
    if (input.last4) {
      if (!/^\d{4}$/.test(String(input.last4))) errors.push('Last 4 digits must be exactly 4 numbers');
      else out.last4 = String(input.last4);
    }
    if (input.expiry) {
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(String(input.expiry))) errors.push('Expiry must look like MM/YY');
      else out.expiry = String(input.expiry);
    }
    if (input.type === 'credit_card' && input.creditLimit !== undefined && input.creditLimit !== '') {
      const limit = Number(input.creditLimit);
      if (Number.isNaN(limit) || limit < 0) errors.push('Credit limit cannot be negative');
      else out.creditLimit = limit;
    }
  }
  if (errors.length) throw httpError(400, errors.join(', '));
  return out;
}

function withTotals(db, account) {
  let income = 0;
  let expense = 0;
  let transactionCount = 0;
  for (const t of db.transactions) {
    if (t.account !== account._id) continue;
    transactionCount += 1;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { ...account, income, expense, transactionCount, balance: account.openingBalance + income - expense };
}

const nameTaken = (db, user, name, exceptId) =>
  db.accounts.some((a) => a.user === user._id && a.name === name && a._id !== exceptId);

export async function getAccounts() {
  await wait();
  const { db, user } = await authed();
  return db.accounts.filter((a) => a.user === user._id).map((a) => withTotals(db, a));
}

export async function createAccount(body) {
  await wait();
  const { db, user } = await authed();
  const data = accountFrom(body);
  if (nameTaken(db, user, data.name)) throw httpError(409, 'You already have an account with this name');
  const account = { _id: crypto.randomUUID(), user: user._id, ...data, createdAt: nowISO(), updatedAt: nowISO() };
  db.accounts.push(account);
  save(db);
  return withTotals(db, account);
}

export async function updateAccount(id, body) {
  await wait();
  const { db, user } = await authed();
  const account = db.accounts.find((a) => a._id === id && a.user === user._id);
  if (!account) throw httpError(404, 'Account not found');
  const data = accountFrom(body);
  if (nameTaken(db, user, data.name, id)) throw httpError(409, 'You already have an account with this name');
  for (const f of CARD_FIELDS) delete account[f];
  Object.assign(account, data, { updatedAt: nowISO() });
  save(db);
  return withTotals(db, account);
}

// Deleting an account keeps its transactions, they just become unlinked
export async function deleteAccount(id) {
  await wait();
  const { db, user } = await authed();
  const index = db.accounts.findIndex((a) => a._id === id && a.user === user._id);
  if (index === -1) throw httpError(404, 'Account not found');
  db.accounts.splice(index, 1);
  let unlinked = 0;
  for (const t of db.transactions) {
    if (t.account === id) {
      t.account = null;
      unlinked += 1;
    }
  }
  save(db);
  return { message: 'Deleted', unlinked };
}
