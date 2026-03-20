import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '../services/payroll.service';

export function useEmployees(companyId: string, status?: string) {
  return useQuery({
    queryKey: ['employees', companyId, status],
    queryFn: () => payrollService.getEmployees(companyId, status),
    enabled: !!companyId,
  });
}

export function useCreateEmployee(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => payrollService.createEmployee(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function usePayrollRuns(companyId: string, year?: number) {
  return useQuery({
    queryKey: ['payroll-runs', companyId, year],
    queryFn: () => payrollService.getPayrollRuns(companyId, year),
    enabled: !!companyId,
  });
}

export function useCreatePayrollRun(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) =>
      payrollService.createPayrollRun(companyId, year, month),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-runs'] }),
  });
}

export function useCalculatePayroll(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollService.calculatePayroll(companyId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-runs'] }),
  });
}

export function useApprovePayroll(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollService.approvePayroll(companyId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-runs'] }),
  });
}

export function usePayslips(companyId: string, runId: string) {
  return useQuery({
    queryKey: ['payslips', companyId, runId],
    queryFn: () => payrollService.getPayslips(companyId, runId),
    enabled: !!companyId && !!runId,
  });
}
