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
        <label
          htmlFor={inputId}
          className={cn(
            'relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full bg-input transition-colors',
            'has-[:checked]:bg-primary',
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2',
            'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
            'has-[:checked]:[&>span]:translate-x-4',
            className,
          )}
        >
          <input type="checkbox" ref={ref} id={inputId} className="sr-only" {...props} />
          <span
            className="pointer-events-none absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-background shadow-sm transition-transform"
            aria-hidden="true"
          />
        </label>
        {label && (
          <span
            className="text-sm cursor-pointer"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            {label}
          </span>
        )}
      </div>
    );
  },
);
Switch.displayName = 'Switch';

export { Switch };
