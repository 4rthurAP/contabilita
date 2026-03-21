import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface DateBRProps {
  value: string | Date;
  format?: 'date' | 'datetime' | 'relative' | 'month';
  className?: string;
}

const FORMAT_MAP = {
  date: 'DD/MM/YYYY',
  datetime: 'DD/MM/YYYY HH:mm',
  month: 'MM/YYYY',
  relative: '',
};

/**
 * Exibe data no formato brasileiro (DD/MM/YYYY).
 * Suporta: date, datetime, month, ou formato relativo ("ha 2 dias").
 */
export function DateBR({ value, format = 'date', className }: DateBRProps) {
  const d = dayjs(value);
  if (!d.isValid()) return <span className={className}>—</span>;

  let display: string;
  if (format === 'relative') {
    const now = dayjs();
    const diffDays = now.diff(d, 'day');
    if (diffDays === 0) display = 'Hoje';
    else if (diffDays === 1) display = 'Ontem';
    else if (diffDays < 30) display = `${diffDays} dias atras`;
    else display = d.format('DD/MM/YYYY');
  } else {
    display = d.format(FORMAT_MAP[format]);
  }

  return (
    <time dateTime={d.toISOString()} className={cn('tabular-nums', className)}>
      {display}
    </time>
  );
}
