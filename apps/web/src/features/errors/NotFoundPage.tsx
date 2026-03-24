import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="text-8xl font-bold text-muted-foreground/20 select-none">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Pagina nao encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        O endereco que voce acessou nao existe ou foi movido. Verifique a URL ou volte ao inicio.
      </p>
      <Link to="/app" className="mt-6">
        <Button>
          <Home className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </Link>
    </div>
  );
}
