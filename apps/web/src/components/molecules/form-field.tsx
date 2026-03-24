import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { HelpTooltip } from '@/components/molecules/help-tooltip';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  className?: string;
  children: ReactNode;
  helpText?: string;
  optional?: boolean;
}

export function FormField({ label, htmlFor, error, className, children, helpText, optional }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor}>{label}</Label>
        {optional && <span className="text-xs text-muted-foreground">(opcional)</span>}
        {helpText && <HelpTooltip help={helpText} />}
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
