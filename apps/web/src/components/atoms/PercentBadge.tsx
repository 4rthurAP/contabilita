import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PercentBadgeProps {
  value: number;
  showIcon?: boolean;
  className?: string;
}

/**
 * Badge que exibe um valor percentual com cor e icone de tendencia.
 * Positivo = verde (up), negativo = vermelho (down), zero = neutro.
 */
export function PercentBadge({ value, showIcon = true, className }: PercentBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  const variant = isPositive ? 'success' : isNegative ? 'danger' : 'neutral';
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <Badge variant={variant} className={cn('gap-1 font-mono tabular-nums', className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {value >= 0 ? '+' : ''}{value.toFixed(1)}%
    </Badge>
  );
}
