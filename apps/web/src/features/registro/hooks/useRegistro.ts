import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { registroService } from '../services/registro.service';

export function useRegistros(companyId: string, status?: string) {
  return useQuery({
    queryKey: ['registros', companyId, status],
    queryFn: () => registroService.getAll(companyId, status),
    enabled: !!companyId,
  });
}

export function useRegistroDetail(companyId: string, id: string) {
  return useQuery({
    queryKey: ['registros', companyId, id],
    queryFn: () => registroService.getById(companyId, id),
    enabled: !!companyId && !!id,
  });
}

export function useCreateRegistro(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => registroService.create(companyId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registros'] }),
  });
}

export function useUpdateRegistroStatus(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      registroService.updateStatus(companyId, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registros'] }),
  });
}

export function useAddAtividade(companyId: string, registroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => registroService.addAtividade(companyId, registroId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registros', companyId, registroId] }),
  });
}

export function useToggleAtividade(companyId: string, registroId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (atividadeId: string) =>
      registroService.toggleAtividade(companyId, registroId, atividadeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registros', companyId, registroId] }),
  });
}
