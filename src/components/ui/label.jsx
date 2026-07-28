import { cn } from '../../lib/utils.js';

export function Label({ className, ...props }) {
  return <label className={cn('ui-label', className)} {...props} />;
}
