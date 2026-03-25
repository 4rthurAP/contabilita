import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppAbility } from '@/lib/ability';
import type { AppAction, AppSubject } from '@contabilita/shared';

interface PermissionGateProps {
  action: AppAction;
  subject: AppSubject;
  children: ReactNode;
}

/**
 * Wrapper de rota que verifica permissao CASL antes de renderizar.
 * Redireciona para o dashboard se o usuario nao tiver acesso.
 */
export function PermissionGate({ action, subject, children }: PermissionGateProps) {
  const ability = useAppAbility();

  if (!ability.can(action, subject)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
