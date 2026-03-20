import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        success: 'bg-success-muted text-success-muted-foreground',
        warning: 'bg-warning-muted text-warning-muted-foreground',
        danger: 'bg-destructive/10 text-destructive',
        info: 'bg-info-muted text-info-muted-foreground',
        neutral: 'bg-secondary text-secondary-foreground',
        outline: 'border text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />
    );
  },
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
