'use client';

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible';
import { cn } from '../../lib/utils.js';

export function Collapsible({ className, ...props }) {
  return <CollapsiblePrimitive.Root className={cn('ui-collapsible', className)} {...props} />;
}

export function CollapsibleTrigger({ className, ...props }) {
  return <CollapsiblePrimitive.Trigger className={cn('ui-collapsible__trigger', className)} {...props} />;
}

export function CollapsibleContent({ className, ...props }) {
  return <CollapsiblePrimitive.Panel className={cn('ui-collapsible__content', className)} {...props} />;
}
