import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { cloneElement, isValidElement } from 'react';
import { cn } from '../../lib/utils.js';

export function Breadcrumb({ className, ...props }) {
  return <nav aria-label="Breadcrumb" className={cn('ui-breadcrumb', className)} {...props} />;
}

export function BreadcrumbList({ className, ...props }) {
  return <ol className={cn('ui-breadcrumb__list', className)} {...props} />;
}

export function BreadcrumbItem({ className, ...props }) {
  return <li className={cn('ui-breadcrumb__item', className)} {...props} />;
}

export function BreadcrumbLink({ render, className, children, ...props }) {
  const linkClassName = cn('ui-breadcrumb__link', className);
  if (isValidElement(render)) {
    return cloneElement(render, {
      ...props,
      className: cn(render.props.className, linkClassName),
      children,
    });
  }
  return <a className={linkClassName} {...props}>{children}</a>;
}

export function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      aria-current="page"
      aria-disabled="true"
      className={cn('ui-breadcrumb__page', className)}
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('ui-breadcrumb__separator', className)}
      {...props}
    >
      {children || <ChevronRight size={14} />}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...props }) {
  return (
    <span
      role="presentation"
      aria-hidden="true"
      className={cn('ui-breadcrumb__ellipsis', className)}
      {...props}
    >
      <MoreHorizontal size={16} />
      <span className="visually-hidden">More</span>
    </span>
  );
}
