import BudgetCard from '../components/BudgetCard';
import { CategoryDonut } from '../components/Charts';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';

export default function Dashboard({ summary, prevSummary, transactions, loading, month, budget, dark, actions }) {
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
          <BudgetCard expense={summary.expense} budget={budget} onSetup={actions.openSettings} />
          <CategoryDonut summary={summary} dark={dark} />
        </div>
        <TransactionList
          compact
          limit={7}
          transactions={transactions}
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
