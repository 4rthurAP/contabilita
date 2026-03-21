import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queueService } from '../services/queue.service';
import { queryDefaults } from '@/lib/query-defaults';

export function useQueueStats() {
  return useQuery({
    queryKey: ['admin', 'queues'],
    queryFn: () => queueService.getAllStats(),
    staleTime: queryDefaults.realtime,
    refetchInterval: 10_000,
  });
}

export function useFailedJobs(queueName: string) {
  return useQuery({
    queryKey: ['admin', 'queues', queueName, 'failed'],
    queryFn: () => queueService.getFailedJobs(queueName),
    enabled: !!queueName,
    staleTime: queryDefaults.realtime,
  });
}

export function useRetryJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { queueName: string; jobId: string }) =>
      queueService.retryJob(params.queueName, params.jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'queues'] }),
  });
}

export function useCleanQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { queueName: string; status: 'completed' | 'failed' }) =>
      queueService.cleanQueue(params.queueName, params.status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'queues'] }),
  });
}
