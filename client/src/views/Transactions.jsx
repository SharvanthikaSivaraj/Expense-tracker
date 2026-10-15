import TransactionList from '../components/TransactionList';

export default function Transactions({ transactions, loading, actions }) {
  return (
    <TransactionList
      transactions={transactions}
      loading={loading}
      onAdd={actions.add}
      onEdit={actions.edit}
      onDelete={actions.remove}
    />
  );
}
