import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => dashboardService.getHealth(),
  });
}
