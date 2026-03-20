import { useMemo, type ReactNode } from 'react';
import { TenantRole, defineAbilityFor } from '@contabilita/shared';
import { AbilityContext } from '@/lib/ability';
import { useTenantStore } from '@/stores/tenant.store';

export function AbilityProvider({ children }: { children: ReactNode }) {
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const tenants = useTenantStore((s) => s.tenants);

  const ability = useMemo(() => {
    if (!currentTenant) {
      return defineAbilityFor(TenantRole.Viewer);
    }
    const membership = tenants.find((t) => t.tenant._id === currentTenant._id);
    const role = (membership?.role as TenantRole) || TenantRole.Viewer;
    return defineAbilityFor(role);
  }, [currentTenant, tenants]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
