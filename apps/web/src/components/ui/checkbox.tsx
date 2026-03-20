import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            ref={ref}
            id={inputId}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input shadow-sm transition-colors',
              'peer-focus-visible:ring-1 peer-focus-visible:ring-ring',
              'peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              className,
            )}
          >
            <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
          </div>
        </div>
        {label && (
          <label htmlFor={inputId} className="text-sm leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
