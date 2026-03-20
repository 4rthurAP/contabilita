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
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      tenants: [],
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setTenants: (tenants) => set({ tenants }),
    }),
    {
      name: 'contabilita-tenant',
      partialize: (state) => ({ currentTenant: state.currentTenant }),
    },
  ),
);
