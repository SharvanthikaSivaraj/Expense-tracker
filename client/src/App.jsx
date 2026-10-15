import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAccount,
  createTransaction,
  deleteAccount,
  deleteTransaction,
  getAccounts,
  getBudgets,
  getGoals,
  getReminders,
  getSummary,
  getTransactions,
  payReminder,
  updateAccount,
  updateTransaction,
} from './api';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { currentMonth, formatDate, formatMoney, greeting, monthLabel, shiftMonth, todayISO } from './constants';
import AccountForm from './components/AccountForm';
import Drawer from './components/Drawer';
import MonthPicker from './components/MonthPicker';
import Nav from './components/Nav';
import TransactionForm from './components/TransactionForm';
import Icon from './components/Icon';
import Accounts from './views/Accounts';
import Dashboard from './views/Dashboard';
import Insights from './views/Insights';
import Plan from './views/Plan';
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
  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [planTab, setPlanTab] = useState('budgets');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drawer, setDrawer] = useState(null); // null | { kind: 'transaction', transaction, type? } | { kind: 'account', account }
  const [toast, setToast] = useState('');
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
      const [list, sum, prev, accts, buds, gls, rems] = await Promise.all([
        getTransactions(m),
        getSummary(m),
        getSummary(shiftMonth(m, -1)).catch(() => null), // comparison is optional
        getAccounts(),
        getBudgets(),
        getGoals(),
        getReminders(),
      ]);
      if (id !== latest.current) return; // a newer request replaced this one
      setTransactions(list);
      setSummary(sum);
      setPrevSummary(prev);
      setAccounts(accts);
      setBudgets(buds);
      setGoals(gls);
      setReminders(rems);
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
    const editing = drawer?.kind === 'transaction' ? drawer.transaction : null;
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

  async function handleSaveAccount(data) {
    const editing = drawer?.kind === 'account' ? drawer.account : null;
    if (editing) await updateAccount(editing._id, data);
    else await createAccount(data);
    setDrawer(null);
    setToast(editing ? 'Account updated' : 'Account added');
    await refresh(month);
  }

  async function handleDeleteAccount(a) {
    const linked = a.transactionCount
      ? `\n${a.transactionCount} linked transaction${a.transactionCount === 1 ? '' : 's'} will be kept but unlinked.`
      : '';
    if (!window.confirm(`Delete the account "${a.name}"?${linked}`)) return;
    try {
      await deleteAccount(a._id);
      setToast('Account deleted');
      await refresh(month);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePayBill(r) {
    try {
      await payReminder(r._id, {});
      setToast(`${r.title} paid and recorded`);
      await refresh(month);
    } catch (err) {
      setError(err.message);
    }
  }

  const overallBudget = budgets.find((b) => b.category === 'ALL')?.limit || 0;

  const actions = {
    payBill: handlePayBill,
    seeBills: () => {
      setPlanTab('bills');
      setView('plan');
    },
    openPlan: () => {
      setPlanTab('budgets');
      setView('plan');
    },
    add: (type) => setDrawer({ kind: 'transaction', transaction: null, type: type === 'income' ? 'income' : 'expense' }),
    edit: (t) => setDrawer({ kind: 'transaction', transaction: t }),
    addAccount: () => setDrawer({ kind: 'account', account: null }),
    editAccount: (a) => setDrawer({ kind: 'account', account: a }),
    removeAccount: handleDeleteAccount,
    seeAccounts: () => setView('accounts'),
    remove: handleDelete,
    seeAll: () => setView('transactions'),
    openSettings: () => setView('settings'),
    notify: (message) => setToast(message),
  };

  const defaultDate = month === currentMonth() ? todayISO() : `${month}-01`;
  const titles = {
    dashboard: [`${greeting()}, ${user.name.split(' ')[0]}`, `Here is your ${monthLabel(month)} overview`],
    transactions: ['Transactions', `Everything for ${monthLabel(month)}`],
    accounts: ['Accounts', 'Your banks, cards and wallets'],
    plan: ['Plan', `Budgets, goals and bills for ${monthLabel(month)}`],
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
        <button type="button" className="icon-btn topbar-settings" aria-label="Settings" onClick={() => setView('settings')}>
          <Icon name="sliders" size={20} />
        </button>
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p className="sub">{subtitle}</p>
          </div>
          {view !== 'settings' && view !== 'accounts' && <MonthPicker month={month} onChange={setMonth} loading={loading} />}
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
            budget={overallBudget}
            reminders={reminders}
            dark={dark}
            accounts={accounts}
            actions={actions}
          />
        )}
        {view === 'transactions' && (
          <Transactions transactions={transactions} accounts={accounts} loading={loading} actions={actions} />
        )}
        {view === 'accounts' && <Accounts accounts={accounts} holder={user.name} loading={loading} actions={actions} />}
        {view === 'plan' && (
          <Plan
            tab={planTab}
            onTab={setPlanTab}
            summary={summary}
            budgets={budgets}
            goals={goals}
            reminders={reminders}
            onChanged={(message) => {
              if (message) setToast(message);
              refresh(month);
            }}
            onError={setError}
          />
        )}
        {view === 'insights' && (
          <Insights summary={summary} transactions={transactions} month={month} budget={overallBudget} dark={dark} />
        )}
        {view === 'settings' && <Settings dark={dark} onToggleTheme={toggleTheme} onOpenPlan={actions.openPlan} />}
        </div>
      </div>

      {drawer && drawer.kind === 'account' && (
        <Drawer title={drawer.account ? 'Edit account' : 'New account'} onClose={closeDrawer}>
          <AccountForm
            key={drawer.account?._id || 'new-account'}
            account={drawer.account}
            onSave={handleSaveAccount}
            onCancel={closeDrawer}
          />
        </Drawer>
      )}

      {drawer && drawer.kind === 'transaction' && (
        <Drawer title={drawer.transaction ? 'Edit transaction' : 'New transaction'} onClose={closeDrawer}>
          <TransactionForm
            key={drawer.transaction?._id || 'new'}
            transaction={drawer.transaction}
            accounts={accounts}
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
