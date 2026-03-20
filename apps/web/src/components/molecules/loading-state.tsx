import { Spinner } from '@/components/ui/spinner';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Carregando...' }: LoadingStateProps) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground py-8">
      <Spinner size="sm" />
      <span>{message}</span>
    </div>
  );
}
