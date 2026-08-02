import { forwardRef } from 'react';
import { cn } from '../../lib/utils.js';
import { Input } from './input.jsx';
import { Textarea } from './textarea.jsx';

export function InputGroup({ className, ...props }) {
  return <div data-slot="input-group" className={cn('ui-input-group', className)} {...props} />;
}

export function InputGroupAddon({ className, align = 'inline-start', onClick, ...props }) {
  function focusControl(event) {
    onClick?.(event);
    if (event.defaultPrevented || event.target.closest('button, a')) return;
    event.currentTarget.parentElement?.querySelector('[data-slot="input-group-control"]')?.focus();
  }

  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn('ui-input-group__addon', className)}
      onClick={focusControl}
      {...props}
    />
  );
}

export const InputGroupInput = forwardRef(function InputGroupInput({ className, ...props }, ref) {
  return (
    <Input
      ref={ref}
      data-slot="input-group-control"
      className={cn('ui-input-group__control', className)}
      {...props}
    />
  );
});

export const InputGroupTextarea = forwardRef(function InputGroupTextarea({ className, ...props }, ref) {
  return (
    <Textarea
      ref={ref}
      data-slot="input-group-control"
      className={cn('ui-input-group__control ui-input-group__textarea', className)}
      {...props}
    />
  );
});

export function InputGroupButton({ className, size = 'xs', variant = 'ghost', type = 'button', ...props }) {
  return (
    <button
      type={type}
      data-slot="input-group-button"
      data-size={size}
      data-variant={variant}
      className={cn('ui-input-group__button', className)}
      {...props}
    />
  );
}

export function InputGroupText({ className, ...props }) {
  return <span data-slot="input-group-text" className={cn('ui-input-group__text', className)} {...props} />;
}
