import { cn } from '@/lib/utils';
import { parseDecimal128 } from '@/utils/formatters';

interface CurrencyProps {
  value: number | string | { $numberDecimal: string };
  showSign?: boolean;
  colorize?: boolean;
  className?: string;
}

/**
 * Formata e exibe um valor monetario em BRL.
 * Suporta Decimal128 do MongoDB, string ou number.
 * Quando `colorize` esta ativo, valores positivos ficam verdes e negativos vermelhos.
 */
export function Currency({ value, showSign = false, colorize = false, className }: CurrencyProps) {
  const num = typeof value === 'object' && value !== null && '$numberDecimal' in value
    ? parseDecimal128(value)
    : typeof value === 'string'
      ? parseFloat(value) || 0
      : (value ?? 0);

  const formatted = Math.abs(num).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const display = showSign && num > 0 ? `+${formatted}` : num < 0 ? `-${formatted}` : formatted;

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        colorize && num > 0 && 'text-success',
        colorize && num < 0 && 'text-destructive',
        className,
      )}
    >
      {display}
    </span>
  );
}
