import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Send the login token with every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected, log out
http.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    const message = err.response?.data?.error || 'Cannot reach the server';
    return Promise.reject(new Error(message));
  }
);

export const register = (body) => http.post('/auth/register', body);
export const login = (body) => http.post('/auth/login', body);
export const getMe = () => http.get('/auth/me');

export const getTransactions = (month) => http.get('/transactions', { params: { month } });
export const getSummary = (month) => http.get('/transactions/summary', { params: { month } });
export const createTransaction = (body) => http.post('/transactions', body);
export const updateTransaction = (id, body) => http.put(`/transactions/${id}`, body);
export const deleteTransaction = (id) => http.delete(`/transactions/${id}`);

export const getBudget = () => http.get('/budget');
export const setBudget = (limit) => http.put('/budget', { limit });
