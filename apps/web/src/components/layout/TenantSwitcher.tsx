import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTenantStore } from '@/stores/tenant.store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function TenantSwitcher() {
  const { currentTenant, setCurrentTenant, setTenants, tenants } = useTenantStore();

  const { data } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants').then((r) => r.data),
  });

  useEffect(() => {
    if (data) {
      setTenants(data);
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
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Criar escritorio</span>
      </Button>
    );
  }

  if (tenants.length <= 1) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 h-8 text-sm sm:min-w-[11.25rem]">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{currentTenant?.name || 'Selecionar'}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 justify-between w-full sm:w-auto sm:min-w-[11.25rem]"
        >
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{currentTenant?.name || 'Selecionar'}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        {tenants.map(({ tenant }) => (
          <DropdownMenuItem
            key={tenant._id}
            onClick={() => setCurrentTenant(tenant)}
            className={cn(
              'min-h-[2.75rem] md:min-h-0',
              currentTenant?._id === tenant._id && 'font-medium',
            )}
          >
            {currentTenant?._id === tenant._id && <Check className="h-3.5 w-3.5" />}
            {tenant.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
