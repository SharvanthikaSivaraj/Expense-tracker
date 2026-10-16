import { useCallback, useEffect, useState } from 'react';
import {
  createTransaction,
  deleteTransaction,
  getBudget,
  getSummary,
  getTransactions,
  setBudget as saveBudget,
  updateTransaction,
} from './api';
import { useAuth } from './auth';
import { currentMonth, formatDate, formatMoney, greeting, monthLabel, todayISO } from './constants';
import Drawer from './components/Drawer';
import MonthPicker from './components/MonthPicker';
import Nav from './components/Nav';
import TransactionForm from './components/TransactionForm';
import Dashboard from './views/Dashboard';
import Transactions from './views/Transactions';

const EMPTY_SUMMARY = { income: 0, expense: 0, balance: 0, byCategory: [] };

export default function App() {
  const { user, logout } = useAuth();
  const [view, setView] = useState('dashboard');
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [budget, setBudget] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawer, setDrawer] = useState(null); // null or { transaction, type }

  // Load the list and the summary together so they never disagree
  const refresh = useCallback(async (m) => {
    setLoading(true);
    setError('');
    try {
      const [list, sum, b] = await Promise.all([getTransactions(m), getSummary(m), getBudget()]);
      setTransactions(list);
      setSummary(sum);
      setBudget(b.limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(month);
  }, [month, refresh]);

  async function handleSave(data) {
    if (drawer.transaction) await updateTransaction(drawer.transaction._id, data);
    else await createTransaction(data);
    setDrawer(null);
    const savedMonth = data.date.slice(0, 7);
    if (savedMonth === month) await refresh(month);
    else setMonth(savedMonth); // jump to the month that now holds the transaction
  }

  async function handleDelete(t) {
    if (!window.confirm(`Delete ${t.category} ${formatMoney(t.amount)} on ${formatDate(t.date)}?`)) return;
    try {
      await deleteTransaction(t._id);
      await refresh(month);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleBudget(limit) {
    const saved = await saveBudget(limit);
    setBudget(saved.limit);
  }

  const actions = {
    add: (type) => setDrawer({ transaction: null, type: type === 'income' ? 'income' : 'expense' }),
    edit: (t) => setDrawer({ transaction: t }),
    remove: handleDelete,
    seeAll: () => setView('transactions'),
    saveBudget: handleBudget,
  };

  const defaultDate = month === currentMonth() ? todayISO() : `${month}-01`;
  const title = view === 'dashboard' ? `${greeting()}, ${user.name.split(' ')[0]}` : 'Transactions';

  return (
    <div className="shell">
      <Nav view={view} onView={setView} onAdd={() => actions.add()} user={user} onLogout={logout} />

      <div className="content">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p className="sub">Your {monthLabel(month)} overview</p>
          </div>
          <MonthPicker month={month} onChange={setMonth} loading={loading} />
        </header>

        {error && (
          <div className="banner error" role="alert">
            <span>{error}</span>
            <button type="button" className="btn" onClick={() => refresh(month)}>Retry</button>
          </div>
        )}

        <div className="view" key={view}>
          {view === 'dashboard' && (
            <Dashboard summary={summary} transactions={transactions} loading={loading} budget={budget} actions={actions} />
          )}
          {view === 'transactions' && <Transactions transactions={transactions} loading={loading} actions={actions} />}
        </div>
      </div>

      {drawer && (
        <Drawer title={drawer.transaction ? 'Edit transaction' : 'New transaction'} onClose={() => setDrawer(null)}>
          <TransactionForm
            key={drawer.transaction?._id || 'new'}
            transaction={drawer.transaction}
            defaultDate={defaultDate}
            defaultType={drawer.type}
            onSave={handleSave}
            onCancel={() => setDrawer(null)}
          />
        </Drawer>
      )}
    </div>
  );
}
