import BudgetCard from '../components/BudgetCard';
import AccountsPanel from '../components/AccountsPanel';
import { CategoryDonut } from '../components/Charts';
import SummaryCards from '../components/SummaryCards';
import { monthLabel, toInputDate } from '../constants';
import UpcomingBills from '../components/UpcomingBills';
import TransactionList from '../components/TransactionList';

export default function Dashboard({ summary, prevSummary, transactions, loading, month, budget, reminders, totalBalance, overview, dark, accounts, actions }) {
  // This month is empty but older activity exists: say so, instead of looking like data was lost
  const lastMonth = overview?.lastDate ? toInputDate(overview.lastDate).slice(0, 7) : null;
  const showJump = !loading && transactions.length === 0 && lastMonth && lastMonth !== month;

  return (
    <>
      {showJump && (
        <div className="jump-banner" role="note">
          <span>
            No activity in {monthLabel(month)}. Your latest transactions are from <strong>{monthLabel(lastMonth)}</strong>.
          </span>
          <button type="button" className="btn small" onClick={() => actions.setMonth(lastMonth)}>
            View {monthLabel(lastMonth)}
          </button>
        </div>
      )}

      <SummaryCards
        totalBalance={totalBalance}
        summary={summary}
        prevSummary={prevSummary}
        transactions={transactions}
        month={month}
        onAdd={actions.add}
      />
      <div className="grid">
        <div className="stack">
          <AccountsPanel accounts={accounts} onAdd={actions.addAccount} onSeeAll={actions.seeAccounts} />
          <UpcomingBills reminders={reminders} onPay={actions.payBill} onSeeAll={actions.seeBills} />
          <BudgetCard expense={summary.expense} budget={budget} onSetup={actions.openPlan} />
          <CategoryDonut summary={summary} dark={dark} />
        </div>
        <TransactionList
          compact
          limit={7}
          transactions={transactions}
          accounts={accounts}
          loading={loading}
          onAdd={actions.add}
          onEdit={actions.edit}
          onDelete={actions.remove}
          onSeeAll={actions.seeAll}
        />
      </div>
    </>
  );
}
