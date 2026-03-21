import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificateService } from '../services/certificate.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useCertificates(companyId?: string) {
  return useQuery({
    queryKey: ['certificates', companyId],
    queryFn: () => certificateService.getAll(companyId),
    staleTime: queryDefaults.reference,
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: ['certificates', 'detail', id],
    queryFn: () => certificateService.getById(id),
    enabled: !!id,
    staleTime: queryDefaults.reference,
  });
}

export function useUploadCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      file: File;
      companyId: string;
      password: string;
      tipo?: string;
      nome?: string;
    }) =>
      certificateService.upload(
        params.file,
        params.companyId,
        params.password,
        params.tipo,
        params.nome,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  });
}

export function useRemoveCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => certificateService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificates'] }),
  });
}
