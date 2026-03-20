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
        <label
          htmlFor={inputId}
          className={cn(
            'flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border border-input shadow-sm transition-colors',
            'has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-ring',
            'has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground',
            'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
            '[&>svg]:opacity-0 has-[:checked]:[&>svg]:opacity-100',
            className,
          )}
        >
          <input
            type="checkbox"
            ref={ref}
            id={inputId}
            className="sr-only"
            {...props}
          />
          <Check className="h-3 w-3 transition-opacity" />
        </label>
        {label && (
          <label htmlFor={inputId} className="text-sm leading-none cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
