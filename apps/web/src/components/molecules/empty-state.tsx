import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  hint?: string;
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { wrapper: 'py-8', icon: 'h-8 w-8 mb-3', title: 'text-sm font-medium', desc: 'text-xs' },
  md: { wrapper: 'py-12', icon: 'h-12 w-12 mb-4', title: 'text-lg font-medium', desc: 'text-sm' },
  lg: { wrapper: 'py-16', icon: 'h-16 w-16 mb-5', title: 'text-xl font-semibold', desc: 'text-base' },
};

export function EmptyState({ icon: Icon, title, description, hint, action, size = 'md' }: EmptyStateProps) {
  const s = sizeMap[size];

  return (
    <Card>
      <CardContent className={cn('flex flex-col items-center justify-center text-center', s.wrapper)}>
        <Icon className={cn('text-muted-foreground/50', s.icon)} />
        <p className={s.title}>{title}</p>
        {description && <p className={cn('text-muted-foreground mt-1', s.desc)}>{description}</p>}
        {hint && <p className="text-xs italic text-muted-foreground/70 mt-2">{hint}</p>}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
