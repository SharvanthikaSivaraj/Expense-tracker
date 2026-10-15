import { formatDate, formatMoney } from '../constants';

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (transactions.length === 0) {
    return (
      <div className="panel">
        <h2>Transactions</h2>
        <p className="muted">No transactions this month. Add one to get started.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Transactions</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Method</th>
              <th>Note</th>
              <th className="num">Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id}>
                <td>{formatDate(t.date)}</td>
                <td>{t.category}</td>
                <td className="cap">{t.paymentMethod}</td>
                <td className="note">{t.note || '-'}</td>
                <td className={`num amount ${t.type}`}>
                  {t.type === 'income' ? '+' : '-'}
                  {formatMoney(t.amount)}
                </td>
                <td className="actions">
                  <button className="link" onClick={() => onEdit(t)}>Edit</button>
                  <button className="link danger" onClick={() => onDelete(t)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
