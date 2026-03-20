import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { administrarService } from '../services/administrar.service';

export function useTarefas(status?: string, prioridade?: string) {
  return useQuery({
    queryKey: ['tarefas', status, prioridade],
    queryFn: () => administrarService.getTarefas({ status, prioridade }),
  });
}

export function useCreateTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => administrarService.createTarefa(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tarefas'] }),
  });
}

export function useCompleteTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => administrarService.completeTarefa(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      qc.invalidateQueries({ queryKey: ['productivity'] });
    },
  });
}

export function useProductivity(year: number, month: number) {
  return useQuery({
    queryKey: ['productivity', year, month],
    queryFn: () => administrarService.getProductivity(year, month),
    enabled: !!year && !!month,
  });
}
