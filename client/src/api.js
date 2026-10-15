import axios from 'axios';
import * as mock from './mockApi';
import { getToken, notifyUnauthorized } from './token';

export { getToken, setToken, setUnauthorizedHandler } from './token';
export { DEMO_ACCOUNT } from './mockApi';

// By default the app talks to the Express API and MongoDB.
// Set VITE_USE_MOCK=true for an offline demo that keeps everything in this browser (see mockApi.js).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Show the "Use demo account" shortcut (the demo user is created by `npm run seed` on the server)
export const SHOW_DEMO = USE_MOCK || import.meta.env.VITE_DEMO_LOGIN === 'true';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && getToken()) notifyUnauthorized();
    return Promise.reject(err);
  }
);

// Turn any failure into a plain Error with a readable message
function fail(err) {
  const message =
    err.response?.data?.error ||
    (err.request ? 'Cannot reach the server. Is the backend running?' : err.message);
  const error = new Error(message);
  error.status = err.response?.status;
  error.suggestion = err.response?.data?.suggestion;
  throw error;
}

const data = (promise) => promise.then((r) => r.data).catch(fail);

const real = {
  register: (body) => data(http.post('/auth/register', body)),
  login: (body) => data(http.post('/auth/login', body)),
  getMe: () => data(http.get('/auth/me')),
  updateProfile: (name) => data(http.put('/auth/me', { name })),
  changePassword: (body) => data(http.put('/auth/me/password', body)),
  deleteMe: (password) => data(http.delete('/auth/me', { data: { password } })),
  getTransactions: (month) => data(http.get('/transactions', { params: { month } })),
  getSummary: (month) => data(http.get('/transactions/summary', { params: { month } })),
  createTransaction: (body) => data(http.post('/transactions', body)),
  updateTransaction: (id, body) => data(http.put(`/transactions/${id}`, body)),
  deleteTransaction: (id) => data(http.delete(`/transactions/${id}`)),
  getAccounts: () => data(http.get('/accounts')),
  createAccount: (body) => data(http.post('/accounts', body)),
  updateAccount: (id, body) => data(http.put(`/accounts/${id}`, body)),
  deleteAccount: (id) => data(http.delete(`/accounts/${id}`)),
  getBudgets: () => data(http.get('/budgets')),
  createBudget: (body) => data(http.post('/budgets', body)),
  updateBudget: (id, body) => data(http.put(`/budgets/${id}`, body)),
  deleteBudget: (id) => data(http.delete(`/budgets/${id}`)),
  getGoals: () => data(http.get('/goals')),
  createGoal: (body) => data(http.post('/goals', body)),
  updateGoal: (id, body) => data(http.put(`/goals/${id}`, body)),
  contributeGoal: (id, amount) => data(http.post(`/goals/${id}/contribute`, { amount })),
  deleteGoal: (id) => data(http.delete(`/goals/${id}`)),
  getReminders: () => data(http.get('/reminders')),
  createReminder: (body) => data(http.post('/reminders', body)),
  updateReminder: (id, body) => data(http.put(`/reminders/${id}`, body)),
  payReminder: (id, body) => data(http.post(`/reminders/${id}/pay`, body || {})),
  deleteReminder: (id) => data(http.delete(`/reminders/${id}`)),
};

const impl = USE_MOCK ? mock : real;

export const register = impl.register;
export const login = impl.login;
export const getMe = impl.getMe;
export const updateProfile = impl.updateProfile;
export const changePassword = impl.changePassword;
export const deleteMe = impl.deleteMe;
export const getTransactions = impl.getTransactions;
export const getSummary = impl.getSummary;
export const createTransaction = impl.createTransaction;
export const updateTransaction = impl.updateTransaction;
export const deleteTransaction = impl.deleteTransaction;
export const getAccounts = impl.getAccounts;
export const createAccount = impl.createAccount;
export const updateAccount = impl.updateAccount;
export const deleteAccount = impl.deleteAccount;
export const getBudgets = impl.getBudgets;
export const createBudget = impl.createBudget;
export const updateBudget = impl.updateBudget;
export const deleteBudget = impl.deleteBudget;
export const getGoals = impl.getGoals;
export const createGoal = impl.createGoal;
export const updateGoal = impl.updateGoal;
export const contributeGoal = impl.contributeGoal;
export const deleteGoal = impl.deleteGoal;
export const getReminders = impl.getReminders;
export const createReminder = impl.createReminder;
export const updateReminder = impl.updateReminder;
export const payReminder = impl.payReminder;
export const deleteReminder = impl.deleteReminder;
