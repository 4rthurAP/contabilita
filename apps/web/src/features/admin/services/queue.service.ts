import { api } from '@/lib/api';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface FailedJob {
  id: string;
  name: string;
  data: Record<string, unknown>;
  failedReason: string;
  attemptsMade: number;
  timestamp: number;
  finishedOn: number;
}

export const queueService = {
  getAllStats: () =>
    api.get<{ data: QueueStats[] }>('/admin/queues').then((r) => r.data.data ?? r.data),

  getQueueStats: (name: string) =>
    api.get<{ data: QueueStats }>(`/admin/queues/${name}`).then((r) => r.data.data ?? r.data),

  getFailedJobs: (name: string) =>
    api.get<{ data: FailedJob[] }>(`/admin/queues/${name}/failed`).then((r) => r.data.data ?? r.data),

  retryJob: (queueName: string, jobId: string) =>
    api.post(`/admin/queues/${queueName}/jobs/${jobId}/retry`).then((r) => r.data),

  cleanQueue: (queueName: string, status: 'completed' | 'failed') =>
    api.delete(`/admin/queues/${queueName}/${status}`).then((r) => r.data),
};
