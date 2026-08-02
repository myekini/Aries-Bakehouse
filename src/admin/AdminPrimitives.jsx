import { LoaderCircle } from 'lucide-react';
import { cn } from '../lib/utils.js';

export function AdminPage({ className, ...props }) {
  return <div className={cn('admin-page', className)} {...props} />;
}

export function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow && <p className="admin-page-header__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="admin-page-header__actions">{actions}</div>}
    </div>
  );
}

export function AdminToolbar({ children, className }) {
  return <div className={cn('admin-toolbar', className)}>{children}</div>;
}

export function AdminStatusBadge({ status, children }) {
  return <span className={`admin-status admin-status--${status}`}>{children || status?.replaceAll('_', ' ')}</span>;
}

export function AdminLoading({ label = 'Loading…' }) {
  return <div className="admin-loading" role="status"><LoaderCircle className="admin-spinner" size={18} aria-hidden="true" />{label}</div>;
}

export function AdminEmpty({ icon: Icon, children }) {
  return <div className="admin-empty">{Icon && <Icon size={20} aria-hidden="true" />}{children}</div>;
}
