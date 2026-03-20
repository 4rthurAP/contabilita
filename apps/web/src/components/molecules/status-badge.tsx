import type { LucideIcon } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusConfig {
  label: string;
  variant: StatusVariant;
  icon?: LucideIcon;
}

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string;
  statusMap: Record<string, StatusConfig>;
}

export function StatusBadge({ status, statusMap, ...props }: StatusBadgeProps) {
  const config = statusMap[status] ?? { label: status, variant: 'neutral' as const };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} {...props}>
      {Icon && <Icon className="mr-1 h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  );
}
