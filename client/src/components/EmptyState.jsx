import Icon from './Icon';

export default function EmptyState({ icon = 'list', title, text, action, small = false }) {
  return (
    <div className={`empty ${small ? 'small' : ''}`}>
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      {title && <h3>{title}</h3>}
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
