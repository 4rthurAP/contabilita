import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ListItemCardProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function ListItemCard({ title, subtitle, actions, children, className, onClick }: ListItemCardProps) {
  return (
    <Card className={cn(onClick && 'cursor-pointer', className)} onClick={onClick}>
      <CardHeader className="py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm flex flex-wrap items-center gap-2">
              {title}
            </CardTitle>
            {subtitle && (
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </CardHeader>
      {children && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
