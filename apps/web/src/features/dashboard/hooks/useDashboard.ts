import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => dashboardService.getHealth(),
    staleTime: queryDefaults.realtime,
  });
}

export function useDashboardSummary(companyId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'summary', companyId],
    queryFn: () => dashboardService.getSummary(companyId),
    staleTime: queryDefaults.realtime,
  });
}

export function useRecentActivity(companyId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'activity', companyId],
    queryFn: () => dashboardService.getActivity(companyId),
    staleTime: queryDefaults.realtime,
  });
}

export function useDreTrend(companyId?: string, months = 12) {
  return useQuery({
    queryKey: ['dashboard', 'dre-trend', companyId, months],
    queryFn: () => dashboardService.getDreTrend(companyId!, months),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useTaxBurden(companyId?: string, year?: number) {
  return useQuery({
    queryKey: ['dashboard', 'tax-burden', companyId, year],
    queryFn: () => dashboardService.getTaxBurden(companyId!, year),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}
