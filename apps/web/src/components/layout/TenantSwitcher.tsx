import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useTenantStore } from '@/stores/tenant.store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function TenantSwitcher() {
  const { currentTenant, setCurrentTenant, setTenants, tenants } = useTenantStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (tenants.length === 0) {
    return (
      <Button variant="outline" size="sm" className="gap-2 text-xs">
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Criar escritorio</span>
      </Button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 justify-between w-full sm:w-auto sm:min-w-[11.25rem]"
        onClick={() => tenants.length > 1 && setOpen(!open)}
      >
        <Building2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{currentTenant?.name || 'Selecionar'}</span>
        {tenants.length > 1 && <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />}
      </Button>

      {open && tenants.length > 1 && (
        <div className="absolute top-full left-0 mt-1 w-full bg-popover border rounded-md shadow-md z-50">
          {tenants.map(({ tenant }) => (
            <button
              key={tenant._id}
              onClick={() => {
                setCurrentTenant(tenant);
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors hover:bg-accent min-h-[2.75rem]',
                currentTenant?._id === tenant._id && 'font-medium',
              )}
            >
              {currentTenant?._id === tenant._id && <Check className="h-3.5 w-3.5" />}
              {tenant.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
