import axios from 'axios';
import { getToken, notifyUnauthorized } from './token';

export { getToken, setToken, setUnauthorizedHandler } from './token';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Send the login token with every request
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or rejected token logs the user out
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

export const register = (body) => data(http.post('/auth/register', body));
export const login = (body) => data(http.post('/auth/login', body));
export const getMe = () => data(http.get('/auth/me'));

export const getTransactions = (month) => data(http.get('/transactions', { params: { month } }));
export const getSummary = (month) => data(http.get('/transactions/summary', { params: { month } }));
export const createTransaction = (body) => data(http.post('/transactions', body));
export const updateTransaction = (id, body) => data(http.put(`/transactions/${id}`, body));
export const deleteTransaction = (id) => data(http.delete(`/transactions/${id}`));

export const getBudget = () => data(http.get('/budget'));
export const setBudget = (limit) => data(http.put('/budget', { limit }));
