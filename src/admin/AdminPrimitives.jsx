import { CircleAlert, LoaderCircle } from 'lucide-react';
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

export function AdminPanel({ title, description, actions, children, className }) {
  return (
    <section className={cn('admin-panel', className)}>
      {(title || description || actions) && (
        <div className="admin-panel__header">
          <div>{title && <h2>{title}</h2>}{description && <p>{description}</p>}</div>
          {actions && <div className="admin-panel__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function AdminField({ label, hint, className, children }) {
  return (
    <label className={cn('admin-field', className)}>
      <span className="admin-field__label">{label}</span>
      {children}
      {hint && <span className="admin-field__hint">{hint}</span>}
    </label>
  );
}

export function AdminFormGrid({ children, className }) {
  return <div className={cn('admin-form-grid', className)}>{children}</div>;
}

export function AdminRecordList({ children, className }) {
  return <div className={cn('admin-record-list', className)}>{children}</div>;
}

export function AdminRecord({ children, className }) {
  return <div className={cn('admin-record', className)}>{children}</div>;
}

export function AdminNotice({ children, tone = 'info' }) {
  return <div className={`admin-notice admin-notice--${tone}`}><CircleAlert size={18} aria-hidden="true" /><p>{children}</p></div>;
}

export function AdminStatusBadge({ status, children }) {
  return <span className={`admin-status admin-status--${status}`}>{children || status?.replaceAll('_', ' ')}</span>;
}

export function AdminLoading({ label = 'Loading…' }) {
  return <div className="admin-loading" role="status"><LoaderCircle className="admin-spinner" size={18} aria-hidden="true" />{label}</div>;
}

export function AdminEmpty({ icon: Icon, children }) {
  return <div className="admin-empty">{Icon && <Icon size={20} aria-hidden="true" />}<p>{children}</p></div>;
}
