import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTransaction,
  deleteTransaction,
  getSummary,
  getTransactions,
  updateTransaction,
} from './api';
import { currentMonth, formatDate, formatMoney } from './constants';
import Charts from './components/Charts';
import MonthPicker from './components/MonthPicker';
import SummaryCards from './components/SummaryCards';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';

const EMPTY_SUMMARY = { income: 0, expense: 0, balance: 0, byCategory: [] };

export default function App() {
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const latest = useRef(0);

  // Always fetch list and summary together so they never disagree
  const refresh = useCallback(async (m) => {
    const id = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const [list, sum] = await Promise.all([getTransactions(m), getSummary(m)]);
      if (id !== latest.current) return; // a newer request replaced this one
      setTransactions(list);
      setSummary(sum);
    } catch (err) {
      if (id === latest.current) setError(err.message);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(month);
  }, [month, refresh]);

  async function handleSave(data) {
    if (editing) {
      await updateTransaction(editing._id, data);
      setEditing(null);
    } else {
      await createTransaction(data);
    }
    const savedMonth = data.date.slice(0, 7);
    if (savedMonth === month) await refresh(month);
    else setMonth(savedMonth); // jump to the month that now holds the transaction
  }

  async function handleDelete(t) {
    const label = `${t.category} ${formatMoney(t.amount)} on ${formatDate(t.date)}`;
    if (!window.confirm(`Delete this transaction?\n${label}`)) return;
    try {
      await deleteTransaction(t._id);
      if (editing?._id === t._id) setEditing(null);
      await refresh(month);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>Expense Tracker</h1>
        <MonthPicker month={month} onChange={setMonth} />
      </header>

      {error && (
        <div className="banner error" role="alert">
          <span>{error}</span>
          <button onClick={() => refresh(month)}>Retry</button>
        </div>
      )}

      <SummaryCards summary={summary} />

      <div className="layout">
        <aside>
          <TransactionForm
            key={editing?._id || 'new'}
            transaction={editing}
            defaultDate={`${month}-01`}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        </aside>

        <main>
          <Charts summary={summary} />
          {loading ? (
            <div className="panel center">
              <div className="spinner" aria-label="Loading" />
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              onEdit={(t) => {
                setEditing(t);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={handleDelete}
            />
          )}
        </main>
      </div>
    </div>
  );
}
