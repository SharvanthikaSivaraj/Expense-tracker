import { formatDate, formatMoney } from '../constants';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) return <p>No transactions this month.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Category</th>
          <th>Paid with</th>
          <th>Note</th>
          <th>Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t._id}>
            <td>{formatDate(t.date)}</td>
            <td>{t.category}</td>
            <td>{t.paymentMethod}</td>
            <td>{t.note}</td>
            <td className={t.type}>
              {t.type === 'income' ? '+' : '-'}
              {formatMoney(t.amount)}
            </td>
            <td>
              <button onClick={() => onEdit(t)}>Edit</button> <button onClick={() => onDelete(t)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
