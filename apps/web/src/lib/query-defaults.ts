/** Shared React Query staleTime defaults */
export const queryDefaults = {
  /** Standard data — 30 seconds */
  standard: 30_000,
  /** Reference data (plano de contas, tabelas fiscais) — 5 minutes */
  reference: 300_000,
  /** Realtime data (notifications, dashboard) — 10 seconds */
  realtime: 10_000,
} as const;
