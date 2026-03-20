import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTenantStore } from '@/stores/tenant.store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function TenantSwitcher() {
  const { currentTenant, setCurrentTenant, setTenants, tenants } = useTenantStore();

  const { data } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants').then((r) => r.data),
  });

  useEffect(() => {
    if (data) {
      setTenants(data);
      // Seleciona o primeiro tenant se nenhum estiver selecionado
      if (!currentTenant && data.length > 0) {
        setCurrentTenant(data[0].tenant);
      }
    }
  }, [data, currentTenant, setCurrentTenant, setTenants]);

  // Atualiza header X-Tenant-Id para todas as requests
  useEffect(() => {
    if (currentTenant) {
      api.defaults.headers.common['X-Tenant-Id'] = currentTenant._id;
    } else {
      delete api.defaults.headers.common['X-Tenant-Id'];
    }
  }, [currentTenant]);

  if (tenants.length === 0) {
    return (
      <Button variant="outline" size="sm" className="gap-2 text-xs">
        <Plus className="h-3 w-3" />
        Criar escritorio
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" className="gap-2 justify-between min-w-[180px]">
        <Building2 className="h-3.5 w-3.5" />
        <span className="truncate">{currentTenant?.name || 'Selecionar'}</span>
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </Button>

      {/* Dropdown simples — sera substituido por Radix Popover na Fase 2+ */}
      {tenants.length > 1 && (
        <div className="absolute top-full left-0 mt-1 w-full bg-popover border rounded-md shadow-md z-50 hidden group-hover:block">
          {tenants.map(({ tenant }) => (
            <button
              key={tenant._id}
              onClick={() => setCurrentTenant(tenant)}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent',
                currentTenant?._id === tenant._id && 'font-medium',
              )}
            >
              {currentTenant?._id === tenant._id && <Check className="h-3 w-3" />}
              {tenant.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
