// A browser-only stand-in for the Express API, backed by localStorage.
// It mirrors the real API's responses and validation so the UI cannot tell the difference.
// Data is per browser; clearing site data resets it.
import { checkEmail } from './emailCheck';
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

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Rent', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];

function demoPlan(userId) {
  const now = new Date();
  const day = (offset) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offset)).toISOString();
  const base = () => ({ _id: crypto.randomUUID(), user: userId, createdAt: nowISO(), updatedAt: nowISO() });
  return {
    budgets: [
      { ...base(), category: 'ALL', limit: 30000 },
      { ...base(), category: 'Food', limit: 4000 },
      { ...base(), category: 'Shopping', limit: 3000 },
      { ...base(), category: 'Entertainment', limit: 1500 },
    ],
    goals: [
      { ...base(), name: 'Goa trip', target: 60000, saved: 22000, deadline: day(150) },
      { ...base(), name: 'Emergency fund', target: 100000, saved: 45000 },
    ],
    reminders: [
      { ...base(), title: 'Phone bill', amount: 599, dueDate: day(-3), repeat: 'monthly', category: 'Bills', paid: false },
      { ...base(), title: 'Electricity bill', amount: 1200, dueDate: day(5), repeat: 'monthly', category: 'Bills', paid: false },
      { ...base(), title: 'Netflix', amount: 649, dueDate: day(11), repeat: 'monthly', category: 'Entertainment', paid: false },
      { ...base(), title: 'Insurance premium', amount: 4500, dueDate: day(24), repeat: 'none', category: 'Health', paid: false },
    ],
  };
}

function attachDemoPlan(db, userId) {
  const plan = demoPlan(userId);
  db.budgets = plan.budgets;
  db.goals = plan.goals;
  db.reminders = plan.reminders;
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
      if (!db.budgets) {
        // database created before budgets, goals and bills existed
        const demo = db.users.find((u) => u.email === DEMO_ACCOUNT.email);
        db.budgets = [];
        db.goals = [];
        db.reminders = [];
        if (demo) attachDemoPlan(db, demo._id);
        save(db);
      }
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
  attachDemoPlan(db, id);
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
  const passErr = passwordProblem(password);
  if (passErr) throw httpError(400, passErr);
  const emailCheck = checkEmail(email);
  if (!emailCheck.ok) throw httpError(400, emailCheck.error);

  const clean = emailCheck.email;
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
  db.budgets = db.budgets.filter((b) => b.user !== user._id);
  db.goals = db.goals.filter((g) => g.user !== user._id);
  db.reminders = db.reminders.filter((r) => r.user !== user._id);
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

// All-time totals split by whether a transaction is linked to an account
export async function getOverview() {
  await wait();
  const { db, user } = await authed();
  const out = { income: 0, expense: 0, unlinkedIncome: 0, unlinkedExpense: 0, unlinkedCount: 0, lastDate: null };
  for (const t of db.transactions) {
    if (t.user !== user._id) continue;
    out[t.type] += t.amount;
    if (!t.account) {
      out[t.type === 'income' ? 'unlinkedIncome' : 'unlinkedExpense'] += t.amount;
      out.unlinkedCount += 1;
    }
    if (!out.lastDate || t.date > out.lastDate) out.lastDate = t.date;
  }
  return out;
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

// ---------- budgets ----------
export async function getBudgets() {
  await wait();
  const { db, user } = await authed();
  return db.budgets.filter((b) => b.user === user._id).sort((a, b) => a.category.localeCompare(b.category));
}

function limitProblem(limit) {
  const n = Number(limit);
  if (limit === '' || limit === undefined || Number.isNaN(n)) return 'Limit is required';
  if (n < 1) return 'Limit must be at least 1';
  return null;
}

export async function createBudget({ category, limit }) {
  await wait();
  const { db, user } = await authed();
  if (category !== 'ALL' && !EXPENSE_CATEGORIES.includes(category)) throw httpError(400, 'Unknown category');
  const problem = limitProblem(limit);
  if (problem) throw httpError(400, problem);
  if (db.budgets.some((b) => b.user === user._id && b.category === category)) {
    throw httpError(409, 'A budget for this category already exists');
  }
  const budget = { _id: crypto.randomUUID(), user: user._id, category, limit: Number(limit), createdAt: nowISO(), updatedAt: nowISO() };
  db.budgets.push(budget);
  save(db);
  return budget;
}

export async function updateBudget(id, { limit }) {
  await wait();
  const { db, user } = await authed();
  const budget = db.budgets.find((b) => b._id === id && b.user === user._id);
  if (!budget) throw httpError(404, 'Budget not found');
  const problem = limitProblem(limit);
  if (problem) throw httpError(400, problem);
  budget.limit = Number(limit);
  budget.updatedAt = nowISO();
  save(db);
  return budget;
}

export async function deleteBudget(id) {
  await wait();
  const { db, user } = await authed();
  const index = db.budgets.findIndex((b) => b._id === id && b.user === user._id);
  if (index === -1) throw httpError(404, 'Budget not found');
  db.budgets.splice(index, 1);
  save(db);
  return { message: 'Deleted' };
}

// ---------- goals ----------
function goalFrom(body, partial = false) {
  const b = body || {};
  const errors = [];
  const out = {};
  const name = typeof b.name === 'string' ? b.name.trim() : '';
  if (!name) errors.push('Goal name is required');
  else if (name.length > 60) errors.push('Goal name cannot exceed 60 characters');
  else out.name = name;

  const target = Number(b.target);
  if (b.target === '' || b.target === undefined || Number.isNaN(target)) errors.push('Target is required');
  else if (target < 1) errors.push('Target must be at least 1');
  else out.target = target;

  if (b.saved !== undefined && b.saved !== '') {
    const saved = Number(b.saved);
    if (Number.isNaN(saved) || saved < 0) errors.push('Saved amount cannot be negative');
    else out.saved = saved;
  }
  if (b.deadline === '' || b.deadline === null || b.deadline === undefined) out.deadline = undefined;
  else {
    const d = new Date(b.deadline);
    if (Number.isNaN(d.getTime())) errors.push('Deadline is not a valid date');
    else out.deadline = d.toISOString();
  }
  if (errors.length && !partial) throw httpError(400, errors.join(', '));
  if (errors.length) throw httpError(400, errors.join(', '));
  return out;
}

export async function getGoals() {
  await wait();
  const { db, user } = await authed();
  return db.goals.filter((g) => g.user === user._id);
}

export async function createGoal(body) {
  await wait();
  const { db, user } = await authed();
  const goal = { _id: crypto.randomUUID(), user: user._id, saved: 0, ...goalFrom(body), createdAt: nowISO(), updatedAt: nowISO() };
  db.goals.push(goal);
  save(db);
  return goal;
}

export async function updateGoal(id, body) {
  await wait();
  const { db, user } = await authed();
  const goal = db.goals.find((g) => g._id === id && g.user === user._id);
  if (!goal) throw httpError(404, 'Goal not found');
  const data = goalFrom(body);
  delete goal.deadline;
  Object.assign(goal, data, { updatedAt: nowISO() });
  if (goal.deadline === undefined) delete goal.deadline;
  save(db);
  return goal;
}

export async function contributeGoal(id, amount) {
  await wait();
  const { db, user } = await authed();
  const goal = db.goals.find((g) => g._id === id && g.user === user._id);
  if (!goal) throw httpError(404, 'Goal not found');
  const n = Number(amount);
  if (!Number.isFinite(n) || n === 0) throw httpError(400, 'Enter an amount other than 0');
  goal.saved = Math.max(0, goal.saved + n);
  goal.updatedAt = nowISO();
  save(db);
  return goal;
}

export async function deleteGoal(id) {
  await wait();
  const { db, user } = await authed();
  const index = db.goals.findIndex((g) => g._id === id && g.user === user._id);
  if (index === -1) throw httpError(404, 'Goal not found');
  db.goals.splice(index, 1);
  save(db);
  return { message: 'Deleted' };
}

// ---------- reminders (bills) ----------
function reminderFrom(body) {
  const b = body || {};
  const errors = [];
  const title = typeof b.title === 'string' ? b.title.trim() : '';
  if (!title) errors.push('Title is required');
  else if (title.length > 60) errors.push('Title cannot exceed 60 characters');
  const amount = Number(b.amount);
  if (b.amount === '' || b.amount === undefined || Number.isNaN(amount)) errors.push('Amount is required');
  else if (amount < 0.01) errors.push('Amount must be at least 0.01');
  const due = new Date(b.dueDate);
  if (!b.dueDate || Number.isNaN(due.getTime())) errors.push('Due date is required');
  const repeat = b.repeat || 'none';
  if (!['none', 'monthly'].includes(repeat)) errors.push('Repeat must be none or monthly');
  const category = b.category || 'Bills';
  if (!EXPENSE_CATEGORIES.includes(category)) errors.push('Unknown category');
  if (errors.length) throw httpError(400, errors.join(', '));
  return { title, amount, dueDate: due.toISOString(), repeat, category };
}

// Same day next month, clamped (Jan 31 -> Feb 28)
function nextMonth(iso) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), last))).toISOString();
}

export async function getReminders() {
  await wait();
  const { db, user } = await authed();
  return db.reminders
    .filter((r) => r.user === user._id)
    .sort((a, b) => Number(a.paid) - Number(b.paid) || new Date(a.dueDate) - new Date(b.dueDate));
}

export async function createReminder(body) {
  await wait();
  const { db, user } = await authed();
  const reminder = { _id: crypto.randomUUID(), user: user._id, paid: false, ...reminderFrom(body), createdAt: nowISO(), updatedAt: nowISO() };
  db.reminders.push(reminder);
  save(db);
  return reminder;
}

export async function updateReminder(id, body) {
  await wait();
  const { db, user } = await authed();
  const reminder = db.reminders.find((r) => r._id === id && r.user === user._id);
  if (!reminder) throw httpError(404, 'Reminder not found');
  Object.assign(reminder, reminderFrom({ ...reminder, ...body }), { updatedAt: nowISO() });
  save(db);
  return reminder;
}

export async function payReminder(id, body = {}) {
  await wait();
  const { db, user } = await authed();
  const reminder = db.reminders.find((r) => r._id === id && r.user === user._id);
  if (!reminder) throw httpError(404, 'Reminder not found');
  const paymentMethod = body.paymentMethod || 'upi';
  if (!METHODS.includes(paymentMethod)) throw httpError(400, 'Invalid payment method');
  if (reminder.paid) throw httpError(400, 'This bill is already paid');
  const account = body.account || null;
  if (account && !db.accounts.some((a) => a._id === account && a.user === user._id)) {
    throw httpError(400, 'Account not found');
  }

  const today = new Date();
  const transaction = {
    _id: crypto.randomUUID(),
    user: user._id,
    amount: reminder.amount,
    type: 'expense',
    category: reminder.category,
    date: new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())).toISOString(),
    paymentMethod,
    note: reminder.title,
    account,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  db.transactions.push(transaction);

  if (reminder.repeat === 'monthly') reminder.dueDate = nextMonth(reminder.dueDate);
  else reminder.paid = true;
  reminder.updatedAt = nowISO();
  save(db);
  return { reminder, transaction };
}

export async function deleteReminder(id) {
  await wait();
  const { db, user } = await authed();
  const index = db.reminders.findIndex((r) => r._id === id && r.user === user._id);
  if (index === -1) throw httpError(404, 'Reminder not found');
  db.reminders.splice(index, 1);
  save(db);
  return { message: 'Deleted' };
}
