import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" ref={ref} id={inputId} className="peer sr-only" {...props} />
          <div
            className={cn(
              'h-5 w-9 rounded-full bg-input transition-colors',
              'peer-checked:bg-primary',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              'after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:shadow-sm after:transition-transform',
              'peer-checked:after:translate-x-4',
              className,
            )}
          />
        </label>
        {label && (
          <label htmlFor={inputId} className="text-sm cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };
