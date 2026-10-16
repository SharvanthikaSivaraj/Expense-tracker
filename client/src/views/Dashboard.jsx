import BudgetCard from '../components/BudgetCard';
import { CategoryDonut, IncomeExpenseBar } from '../components/Charts';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';

export default function Dashboard({ summary, transactions, loading, budget, dark, actions }) {
  return (
    <>
      <SummaryCards summary={summary} onAdd={actions.add} />
      <div className="grid">
        <div className="stack">
          <BudgetCard expense={summary.expense} budget={budget} onSave={actions.saveBudget} />
          <CategoryDonut summary={summary} dark={dark} />
          <IncomeExpenseBar summary={summary} dark={dark} />
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
