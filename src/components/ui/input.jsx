import { cn } from '../../lib/utils.js';
import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} data-slot="input" className={cn('ui-input', className)} {...props} />;
});
