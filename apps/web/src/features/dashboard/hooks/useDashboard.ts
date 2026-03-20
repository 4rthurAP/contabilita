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
