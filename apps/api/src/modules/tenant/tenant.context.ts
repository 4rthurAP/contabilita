import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  tenantId: string;
  userId: string;
  role: string;
}

/**
 * AsyncLocalStorage para propagar o contexto do tenant em toda a request.
 * Elimina a necessidade de passar tenantId manualmente por cada camada.
 */
export const tenantContext = new AsyncLocalStorage<TenantContextData>();

export function getCurrentTenant(): TenantContextData | undefined {
  return tenantContext.getStore();
}

export function requireCurrentTenant(): TenantContextData {
  const ctx = tenantContext.getStore();
  if (!ctx) {
    throw new Error('Tenant context not available. Ensure TenantMiddleware is applied.');
  }
  return ctx;
}
