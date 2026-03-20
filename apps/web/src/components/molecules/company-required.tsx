import { useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Building2 } from 'lucide-react';
import { EmptyState } from './empty-state';

interface CompanyRequiredProps {
  children: (companyId: string) => ReactNode;
}

export function CompanyRequired({ children }: CompanyRequiredProps) {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';

  if (!companyId) {
    return (
      <EmptyState
        icon={Building2}
        title="Nenhuma empresa selecionada"
        description="Selecione uma empresa para continuar"
      />
    );
  }

  return <>{children(companyId)}</>;
}
