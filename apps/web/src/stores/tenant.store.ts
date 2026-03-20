import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tenant {
  _id: string;
  name: string;
  slug: string;
  cnpj: string;
  plan: string;
}

interface TenantState {
  currentTenant: Tenant | null;
  tenants: { tenant: Tenant; role: string }[];
  setCurrentTenant: (tenant: Tenant | null) => void;
  setTenants: (tenants: { tenant: Tenant; role: string }[]) => void;
  getCurrentRole: () => string | null;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      tenants: [],
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setTenants: (tenants) => set({ tenants }),
      getCurrentRole: () => {
        const { currentTenant, tenants } = get();
        if (!currentTenant) return null;
        const membership = tenants.find((t) => t.tenant._id === currentTenant._id);
        return membership?.role ?? null;
      },
    }),
    {
      name: 'contabilita-tenant',
      partialize: (state) => ({ currentTenant: state.currentTenant }),
    },
  ),
);
