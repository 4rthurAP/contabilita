import { useQuery } from '@tanstack/react-query';
import { employeePortalService } from '../services/employee-portal.service';

export function useMyProfile() {
  return useQuery({
    queryKey: ['employee-portal', 'profile'],
    queryFn: () => employeePortalService.getProfile(),
  });
}

export function useMyPayslips() {
  return useQuery({
    queryKey: ['employee-portal', 'payslips'],
    queryFn: () => employeePortalService.getPayslips(),
  });
}

export function usePayslipDetail(id: string) {
  return useQuery({
    queryKey: ['employee-portal', 'payslips', id],
    queryFn: () => employeePortalService.getPayslipDetail(id),
    enabled: !!id,
  });
}
