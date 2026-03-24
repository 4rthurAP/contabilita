import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useOnboardingProgress, type OnboardingStep } from '../hooks/useOnboardingProgress';
import { cn } from '@/lib/utils';

interface WelcomeCardProps {
  onDismiss?: () => void;
}

export function WelcomeCard({ onDismiss }: WelcomeCardProps) {
  const user = useAuthStore((s) => s.user);
  const { steps, completedCount, isComplete, isLoading } = useOnboardingProgress();

  if (isLoading) return null;

  if (isComplete) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-6">
          <Sparkles className="h-8 w-8 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Tudo pronto!</p>
            <p className="text-sm text-muted-foreground">
              Seu escritorio esta configurado. Bom trabalho!
            </p>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Fechar
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">
          Bem-vindo ao Contabilita{firstName ? `, ${firstName}` : ''}!
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete estes passos para comecar a usar o sistema — {completedCount} de {steps.length} concluidos
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((step, i) => (
          <StepItem key={step.key} step={step} index={i + 1} />
        ))}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-3 block"
          >
            Pular configuracao
          </button>
        )}
      </CardContent>
    </Card>
  );
}

function StepItem({ step, index }: { step: OnboardingStep; index: number }) {
  return (
    <Link
      to={step.done ? '#' : step.href}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-colors',
        step.done
          ? 'border-primary/20 bg-primary/5 opacity-70'
          : 'border-border bg-background hover:border-primary/30 hover:bg-primary/5',
      )}
    >
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          step.done
            ? 'bg-primary text-primary-foreground'
            : 'border-2 border-muted-foreground/30 text-muted-foreground',
        )}
      >
        {step.done ? <Check className="h-3.5 w-3.5" /> : index}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', step.done && 'line-through')}>{step.label}</p>
        <p className="text-xs text-muted-foreground">{step.description}</p>
      </div>
      {!step.done && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </Link>
  );
}
