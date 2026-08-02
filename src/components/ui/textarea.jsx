import { cn } from '../../lib/utils.js';
import { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} data-slot="textarea" className={cn('ui-input ui-textarea', className)} {...props} />;
});
