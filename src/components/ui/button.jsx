import { cloneElement, isValidElement } from 'react';
import { cn } from '../../lib/utils.js';

const variantClass = {
  default: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  olive: 'btn btn-olive',
  whatsapp: 'btn btn-whatsapp',
  ghost: 'ui-button-ghost',
};

const sizeClass = {
  default: '',
  sm: 'btn-sm',
  lg: 'btn-lg',
  icon: 'ui-button-icon',
};

export function Button({ className, variant = 'default', size = 'default', asChild = false, children, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(variantClass[variant], sizeClass[size], className)} {...props}>
      {children}
    </Comp>
  );
}

function Slot({ children, className, ...props }) {
  const child = Array.isArray(children) ? children[0] : children;
  if (!isValidElement(child)) return child;
  return cloneElement(child, {
    ...props,
    className: cn(child.props?.className, className),
  });
}
