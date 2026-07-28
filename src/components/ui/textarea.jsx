import { cn } from '../../lib/utils.js';

export function Textarea({ className, ...props }) {
  return <textarea className={cn('ui-input ui-textarea', className)} {...props} />;
}
