import TransactionList from '../components/TransactionList';

export default function Transactions({ transactions, accounts, loading, month, actions }) {
  return (
    <TransactionList
      transactions={transactions}
      accounts={accounts}
      exportName={`expense-tracker-${month}`}
      loading={loading}
      onAdd={actions.add}
      onEdit={actions.edit}
      onDelete={actions.remove}
    />
  );
}
