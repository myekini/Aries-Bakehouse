import { cn } from '../../lib/utils.js';

export function Select({ className, ...props }) {
  return <select className={cn('ui-input', className)} {...props} />;
}
