import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createTransaction,
  deleteTransaction,
  getSummary,
  getTransactions,
  updateTransaction,
} from './api';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { currentMonth, formatDate, formatMoney, greeting, monthLabel, shiftMonth, todayISO } from './constants';
import Drawer from './components/Drawer';
import MonthPicker from './components/MonthPicker';
import Nav from './components/Nav';
import TransactionForm from './components/TransactionForm';
import { useBudget } from './hooks';
import Dashboard from './views/Dashboard';
import Insights from './views/Insights';
import Settings from './views/Settings';
import Transactions from './views/Transactions';

const EMPTY_SUMMARY = { income: 0, expense: 0, balance: 0, byCategory: [] };

export default function App() {
  const { user, logout } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const [view, setView] = useState('dashboard');
  const [month, setMonth] = useState(currentMonth);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [prevSummary, setPrevSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawer, setDrawer] = useState(null); // null | { transaction: object | null, type?: string }
  const [toast, setToast] = useState('');
  const [budget, setBudget] = useBudget(user._id);
  const latest = useRef(0);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  // Always fetch list and summaries together so they never disagree
  const refresh = useCallback(async (m) => {
    const id = ++latest.current;
    setLoading(true);
    setError('');
    try {
      const [list, sum, prev] = await Promise.all([
        getTransactions(m),
        getSummary(m),
        getSummary(shiftMonth(m, -1)).catch(() => null), // comparison is optional
      ]);
      if (id !== latest.current) return; // a newer request replaced this one
      setTransactions(list);
      setSummary(sum);
      setPrevSummary(prev);
    } catch (err) {
      if (id === latest.current) setError(err.message);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh(month);
  }, [month, refresh]);

  const closeDrawer = useCallback(() => setDrawer(null), []);

  async function handleSave(data) {
    const editing = drawer?.transaction;
    if (editing) await updateTransaction(editing._id, data);
    else await createTransaction(data);

    setDrawer(null);
    setToast(editing ? 'Transaction updated' : 'Transaction added');
    const savedMonth = data.date.slice(0, 7);
    if (savedMonth === month) await refresh(month);
    else setMonth(savedMonth); // jump to the month that now holds the transaction
  }

  async function handleDelete(t) {
    const label = `${t.category} ${formatMoney(t.amount)} on ${formatDate(t.date)}`;
    if (!window.confirm(`Delete this transaction?\n${label}`)) return;
    try {
      await deleteTransaction(t._id);
      setToast('Transaction deleted');
      await refresh(month);
    } catch (err) {
      setError(err.message);
    }
  }

  const actions = {
    add: (type) => setDrawer({ transaction: null, type: type === 'income' ? 'income' : 'expense' }),
    edit: (t) => setDrawer({ transaction: t }),
    remove: handleDelete,
    seeAll: () => setView('transactions'),
    openSettings: () => setView('settings'),
  };

  const defaultDate = month === currentMonth() ? todayISO() : `${month}-01`;
  const titles = {
    dashboard: [`${greeting()}, ${user.name.split(' ')[0]}`, `Here is your ${monthLabel(month)} overview`],
    transactions: ['Transactions', `Everything for ${monthLabel(month)}`],
    insights: ['Insights', `How ${monthLabel(month)} looks`],
    settings: ['Settings', 'Make it yours'],
  };
  const [title, subtitle] = titles[view];

  return (
    <div className="shell">
      <Nav
        view={view}
        onView={setView}
        onAdd={() => actions.add()}
        dark={dark}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={logout}
      />

      <div className="content">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p className="sub">{subtitle}</p>
          </div>
          {view !== 'settings' && <MonthPicker month={month} onChange={setMonth} loading={loading} />}
        </header>

        {error && (
          <div className="banner error" role="alert">
            <span>{error}</span>
            <button type="button" className="btn" onClick={() => refresh(month)}>Retry</button>
          </div>
        )}

        <div className="view" key={view}>
        {view === 'dashboard' && (
          <Dashboard
            summary={summary}
            prevSummary={prevSummary}
            transactions={transactions}
            loading={loading}
            month={month}
            budget={budget}
            dark={dark}
            actions={actions}
          />
        )}
        {view === 'transactions' && <Transactions transactions={transactions} loading={loading} actions={actions} />}
        {view === 'insights' && (
          <Insights summary={summary} transactions={transactions} month={month} budget={budget} dark={dark} />
        )}
        {view === 'settings' && (
          <Settings dark={dark} onToggleTheme={toggleTheme} budget={budget} onBudgetChange={setBudget} />
        )}
        </div>
      </div>

      {drawer && (
        <Drawer title={drawer.transaction ? 'Edit transaction' : 'New transaction'} onClose={closeDrawer}>
          <TransactionForm
            key={drawer.transaction?._id || 'new'}
            transaction={drawer.transaction}
            defaultDate={defaultDate}
            defaultType={drawer.type}
            onSave={handleSave}
            onCancel={closeDrawer}
          />
        </Drawer>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
