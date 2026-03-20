import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService, CreateCompanyRequest } from '../services/company.service';
import { useTenantStore } from '@/stores/tenant.store';
import { queryDefaults } from '@/lib/query-defaults';

export function useCompanies(page = 1, search?: string) {
  const currentTenant = useTenantStore((s) => s.currentTenant);

  return useQuery({
    queryKey: ['companies', currentTenant?._id, page, search],
    queryFn: () => companyService.list(page, 20, search),
    enabled: !!currentTenant,
    staleTime: queryDefaults.standard,
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => companyService.getById(id),
    enabled: !!id,
    staleTime: queryDefaults.standard,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyRequest) => companyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCompanyRequest> }) =>
      companyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companyService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
}
