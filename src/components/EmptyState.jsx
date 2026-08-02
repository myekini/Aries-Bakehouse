import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon = PackageOpen, title, desc, actionLabel, actionTo, children }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon"><Icon size={22} aria-hidden="true" /></span>
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
      {actionLabel && actionTo && <Link to={actionTo} className="btn btn-primary">{actionLabel}</Link>}
      {children}
    </div>
  );
}
