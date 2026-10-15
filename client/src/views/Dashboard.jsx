import BudgetCard from '../components/BudgetCard';
import AccountsPanel from '../components/AccountsPanel';
import { CategoryDonut } from '../components/Charts';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';

export default function Dashboard({ summary, prevSummary, transactions, loading, month, budget, dark, accounts, actions }) {
  return (
    <>
      <SummaryCards
        summary={summary}
        prevSummary={prevSummary}
        transactions={transactions}
        month={month}
        onAdd={actions.add}
      />
      <div className="grid">
        <div className="stack">
          <AccountsPanel accounts={accounts} onAdd={actions.addAccount} onSeeAll={actions.seeAccounts} />
          <BudgetCard expense={summary.expense} budget={budget} onSetup={actions.openSettings} />
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
