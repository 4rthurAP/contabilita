import { useQuery } from '@tanstack/react-query';
import { employeePortalService } from '../services/employee-portal.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useMyProfile() {
  return useQuery({
    queryKey: ['employee-portal', 'profile'],
    queryFn: () => employeePortalService.getProfile(),
    staleTime: queryDefaults.standard,
  });
}

export function useMyPayslips() {
  return useQuery({
    queryKey: ['employee-portal', 'payslips'],
    queryFn: () => employeePortalService.getPayslips(),
    staleTime: queryDefaults.standard,
  });
}

export function usePayslipDetail(id: string) {
  return useQuery({
    queryKey: ['employee-portal', 'payslips', id],
    queryFn: () => employeePortalService.getPayslipDetail(id),
    enabled: !!id,
    staleTime: queryDefaults.standard,
  });
}
