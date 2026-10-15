import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Turn any failure into a plain Error with a readable message
function fail(err) {
  const message =
    err.response?.data?.error ||
    (err.request ? 'Cannot reach the server. Is the backend running?' : err.message);
  throw new Error(message);
}

export const getTransactions = (month) =>
  api.get('/transactions', { params: { month } }).then((r) => r.data).catch(fail);

export const getSummary = (month) =>
  api.get('/transactions/summary', { params: { month } }).then((r) => r.data).catch(fail);

export const createTransaction = (data) =>
  api.post('/transactions', data).then((r) => r.data).catch(fail);

export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data).then((r) => r.data).catch(fail);

export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`).then((r) => r.data).catch(fail);
