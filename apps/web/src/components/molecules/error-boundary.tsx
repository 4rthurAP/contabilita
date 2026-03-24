import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <Card className="max-w-lg w-full">
            <CardContent className="flex flex-col items-center text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-semibold">Algo deu errado</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Ocorreu um erro inesperado. Tente recarregar a pagina.
              </p>
              {this.state.error && (
                <pre className="text-xs text-muted-foreground bg-muted rounded-md p-3 mb-4 max-w-full overflow-x-auto">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.location.reload()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recarregar
                </Button>
                <Button onClick={() => (window.location.href = '/app')}>
                  <Home className="mr-2 h-4 w-4" />
                  Voltar ao inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
