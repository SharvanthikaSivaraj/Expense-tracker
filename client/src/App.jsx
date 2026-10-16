import { useEffect, useState } from 'react';
import {
  createTransaction,
  deleteTransaction,
  getBudget,
  getSummary,
  getTransactions,
  setBudget,
  updateTransaction,
} from './api';
import { currentMonth, formatDate, formatMoney, today } from './constants';
import BudgetCard from './components/BudgetCard';
import CategoryChart from './components/CategoryChart';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';

export default function App({ user, onLogout }) {
  const [month, setMonth] = useState(currentMonth());
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, byCategory: [] });
  const [budget, setBudgetLimit] = useState(0);
  const [form, setForm] = useState(null); // null = hidden, {} = new, transaction = editing
  const [error, setError] = useState('');

  async function load() {
    try {
      const [list, sum, b] = await Promise.all([getTransactions(month), getSummary(month), getBudget()]);
      setTransactions(list);
      setSummary(sum);
      setBudgetLimit(b.limit);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [month]);

  async function save(data) {
    if (form._id) await updateTransaction(form._id, data);
    else await createTransaction(data);
    setForm(null);
    if (data.date.slice(0, 7) === month) load();
    else setMonth(data.date.slice(0, 7)); // show the month the transaction was added to
  }

  async function remove(t) {
    if (!window.confirm(`Delete ${t.category} ${formatMoney(t.amount)} on ${formatDate(t.date)}?`)) return;
    await deleteTransaction(t._id);
    load();
  }

  async function saveBudget(limit) {
    const saved = await setBudget(limit);
    setBudgetLimit(saved.limit);
  }

  return (
    <div className="page">
      <header>
        <h1>Expense Tracker</h1>
        <span>
          {user.name} <button onClick={onLogout}>Log out</button>
        </span>
      </header>

      <p>
        Month: <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
      </p>

      {error && <p className="error">{error}</p>}

      <div className="summary">
        <div className="box">Income<b className="income">{formatMoney(summary.income)}</b></div>
        <div className="box">Expense<b className="expense">{formatMoney(summary.expense)}</b></div>
        <div className="box">Balance<b>{formatMoney(summary.balance)}</b></div>
      </div>

      <div className="two">
        <BudgetCard spent={summary.expense} budget={budget} onSave={saveBudget} />
        <CategoryChart categories={summary.byCategory} />
      </div>

      <h2>Transactions</h2>
      {form ? (
        <TransactionForm
          key={form._id || 'new'}
          transaction={form._id ? form : null}
          defaultDate={month === currentMonth() ? today() : `${month}-01`}
          onSave={save}
          onCancel={() => setForm(null)}
        />
      ) : (
        <button onClick={() => setForm({})}>Add transaction</button>
      )}
      <TransactionList transactions={transactions} onEdit={setForm} onDelete={remove} />
    </div>
  );
}
