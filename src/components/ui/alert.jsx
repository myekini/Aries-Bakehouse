import { cn } from '../../lib/utils.js';

const variantClass = {
  default: 'ui-alert--default',
  destructive: 'ui-alert--destructive',
  success: 'ui-alert--success',
  warning: 'ui-alert--warning',
};

export function Alert({ className, variant = 'default', role, ...props }) {
  return (
    <div
      className={cn('ui-alert', variantClass[variant] || variantClass.default, className)}
      role={role || (variant === 'destructive' ? 'alert' : 'status')}
      {...props}
    />
  );
}

export function AlertTitle({ className, ...props }) {
  return <div className={cn('ui-alert__title', className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
  return <div className={cn('ui-alert__description', className)} {...props} />;
}

export function AlertAction({ className, ...props }) {
  return <div className={cn('ui-alert__action', className)} {...props} />;
}
