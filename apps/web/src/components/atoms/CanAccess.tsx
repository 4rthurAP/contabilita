import type { ReactNode } from 'react';
import type { AppAction, AppSubject } from '@contabilita/shared';
import { useAppAbility } from '@/lib/ability';

interface CanAccessProps {
  action: AppAction;
  subject: AppSubject;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CanAccess({ action, subject, children, fallback = null }: CanAccessProps) {
  const ability = useAppAbility();
  return ability.can(action, subject) ? <>{children}</> : <>{fallback}</>;
}
