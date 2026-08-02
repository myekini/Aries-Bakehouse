'use client';

import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import { TriangleAlert } from 'lucide-react';
import { cloneElement, isValidElement } from 'react';
import { cn } from '../../lib/utils.js';

export function AlertDialog(props) {
  return <AlertDialogPrimitive.Root {...props} />;
}

export function AlertDialogTrigger(props) {
  return <AlertDialogPrimitive.Trigger {...props} />;
}

export function AlertDialogContent({ className, size = 'default', children, ...props }) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop className="ui-alert-dialog__backdrop" />
      <AlertDialogPrimitive.Viewport className="ui-alert-dialog__viewport">
        <AlertDialogPrimitive.Popup
          className={cn('ui-alert-dialog__content', className)}
          data-size={size}
          {...props}
        >
          {children}
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Viewport>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogHeader({ className, ...props }) {
  return <div className={cn('ui-alert-dialog__header', className)} {...props} />;
}

export function AlertDialogMedia({ className, ...props }) {
  return <div className={cn('ui-alert-dialog__media', className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }) {
  return <AlertDialogPrimitive.Title className={cn('ui-alert-dialog__title', className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }) {
  return <AlertDialogPrimitive.Description className={cn('ui-alert-dialog__description', className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }) {
  return <div className={cn('ui-alert-dialog__footer', className)} {...props} />;
}

export function AlertDialogCancel({ className, ...props }) {
  return <AlertDialogPrimitive.Close className={cn('btn btn-secondary btn-sm', className)} {...props} />;
}

export function AlertDialogAction({ className, variant = 'default', ...props }) {
  return (
    <AlertDialogPrimitive.Close
      className={cn('btn btn-sm', variant === 'destructive' ? 'ui-alert-dialog__destructive' : 'btn-primary', className)}
      {...props}
    />
  );
}

export function ConfirmAlertDialog({
  trigger,
  title,
  description,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = true,
  size = 'sm',
}) {
  const triggerContent = isValidElement(trigger) ? trigger.props.children : null;
  const triggerRenderer = isValidElement(trigger)
    ? cloneElement(trigger, undefined, null)
    : trigger;

  return (
    <AlertDialog>
      <AlertDialogTrigger render={triggerRenderer}>{triggerContent}</AlertDialogTrigger>
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogMedia className={destructive ? 'is-destructive' : ''}>
            <TriangleAlert size={20} aria-hidden="true" />
          </AlertDialogMedia>
          <div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
