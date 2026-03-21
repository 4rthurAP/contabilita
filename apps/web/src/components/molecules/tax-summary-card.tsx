import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/components/atoms/Currency';
import { PercentBadge } from '@/components/atoms/PercentBadge';
import { cn } from '@/lib/utils';

interface TaxSummaryCardProps {
  title: string;
  totalValue: number;
  previousValue?: number;
  icon?: LucideIcon;
  items?: { label: string; value: number }[];
  className?: string;
}

/**
 * Card de resumo fiscal com total, variacao percentual em relacao
 * ao periodo anterior, e breakdown opcional por tipo de imposto.
 */
export function TaxSummaryCard({
  title,
  totalValue,
  previousValue,
  icon: Icon,
  items,
  className,
}: TaxSummaryCardProps) {
  const variation =
    previousValue && previousValue !== 0
      ? ((totalValue - previousValue) / previousValue) * 100
      : undefined;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <Currency value={totalValue} className="text-2xl font-bold" />
          {variation !== undefined && <PercentBadge value={variation} />}
        </div>

        {items && items.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{item.label}</span>
                <Currency value={item.value} className="text-sm font-medium" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
