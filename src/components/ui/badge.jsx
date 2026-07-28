import { cn } from '../../lib/utils.js';

const variantClass = {
  default: 'ui-badge',
  olive: 'ui-badge ui-badge-olive',
  caramel: 'ui-badge ui-badge-caramel',
  muted: 'ui-badge ui-badge-muted',
};

export function Badge({ className, variant = 'default', ...props }) {
  return <span className={cn(variantClass[variant], className)} {...props} />;
}
