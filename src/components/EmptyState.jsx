import { Link } from 'react-router-dom';

export default function EmptyState({ title, desc, actionLabel, actionTo }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <div style={{ fontWeight: 700, fontSize: 20 }}>{title}</div>
      {desc && <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 10 }}>{desc}</div>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 24 }}>{actionLabel}</Link>
      )}
    </div>
  );
}
