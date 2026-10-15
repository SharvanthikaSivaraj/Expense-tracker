import axios from 'axios';
import * as mock from './mockApi';
import { getToken, notifyUnauthorized } from './token';

export { getToken, setToken, setUnauthorizedHandler } from './token';
export { DEMO_ACCOUNT } from './mockApi';

// Demo mode keeps everything in this browser (see mockApi.js).
// Set VITE_USE_MOCK=false to talk to the Express API instead.
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

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
