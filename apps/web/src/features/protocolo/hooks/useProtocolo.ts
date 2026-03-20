import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { protocoloService } from '../services/protocolo.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useProtocolos(companyId: string, status?: string, tipo?: string) {
  return useQuery({
    queryKey: ['protocolos', companyId, status, tipo],
    queryFn: () => protocoloService.getProtocolos(companyId, { status, tipo }),
    enabled: !!companyId,
    staleTime: queryDefaults.standard,
  });
}

export function useCreateProtocolo(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => protocoloService.createProtocolo(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocolos'] }),
  });
}

export function useUpdateProtocoloStatus(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      protocoloService.updateStatus(companyId, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['protocolos'] }),
  });
}
