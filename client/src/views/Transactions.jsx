import TransactionList from '../components/TransactionList';

export default function Transactions({ transactions, accounts, loading, actions }) {
  return (
    <TransactionList
      transactions={transactions}
      accounts={accounts}
      loading={loading}
      onAdd={actions.add}
      onEdit={actions.edit}
      onDelete={actions.remove}
    />
  );
}
