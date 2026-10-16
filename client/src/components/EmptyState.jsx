export default function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
