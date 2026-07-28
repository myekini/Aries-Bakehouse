import { cn } from '../../lib/utils.js';

export function Card({ className, ...props }) {
  return <div className={cn('card', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('ui-card-header', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('ui-card-content', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <div className={cn('ui-card-title', className)} {...props} />;
}
