import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function ServerErrorPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-bold text-muted-foreground/20 select-none">500</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Erro interno</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Algo deu errado no servidor. Tente novamente em alguns instantes.
      </p>
      <Button className="mt-6" onClick={() => window.location.reload()}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
