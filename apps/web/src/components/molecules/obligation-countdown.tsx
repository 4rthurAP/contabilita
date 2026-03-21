import { Clock, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DateBR } from '@/components/atoms/DateBR';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

interface ObligationCountdownProps {
  nome: string;
  competencia: string;
  prazo: string | Date;
  status: 'pendente' | 'entregue' | 'atrasada';
  className?: string;
}

/**
 * Card compacto com contagem regressiva para uma obrigacao fiscal.
 * Mostra cores e icones de urgencia baseados no prazo restante.
 */
export function ObligationCountdown({
  nome,
  competencia,
  prazo,
  status,
  className,
}: ObligationCountdownProps) {
  const deadline = dayjs(prazo);
  const now = dayjs();
  const daysLeft = deadline.diff(now, 'day');

  const isOverdue = status === 'atrasada' || (status === 'pendente' && daysLeft < 0);
  const isUrgent = status === 'pendente' && daysLeft >= 0 && daysLeft <= 5;
  const isDone = status === 'entregue';

  const Icon = isDone
    ? CheckCircle2
    : isOverdue
      ? AlertCircle
      : isUrgent
        ? AlertTriangle
        : Clock;

  const iconColor = isDone
    ? 'text-success'
    : isOverdue
      ? 'text-destructive'
      : isUrgent
        ? 'text-warning'
        : 'text-muted-foreground';

  const countdownText = isDone
    ? 'Entregue'
    : isOverdue
      ? `${Math.abs(daysLeft)} dia(s) em atraso`
      : daysLeft === 0
        ? 'Vence hoje'
        : daysLeft === 1
          ? 'Vence amanha'
          : `${daysLeft} dias restantes`;

  const badgeVariant = isDone
    ? 'success'
    : isOverdue
      ? 'danger'
      : isUrgent
        ? 'warning'
        : ('neutral' as const);

  return (
    <Card className={cn('', className)}>
      <CardContent className="flex items-center gap-3 py-3">
        <Icon className={cn('h-5 w-5 shrink-0', iconColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{nome}</p>
          <p className="text-xs text-muted-foreground">
            {competencia} — <DateBR value={prazo} />
          </p>
        </div>
        <Badge variant={badgeVariant} className="shrink-0 text-xs">
          {countdownText}
        </Badge>
      </CardContent>
    </Card>
  );
}
