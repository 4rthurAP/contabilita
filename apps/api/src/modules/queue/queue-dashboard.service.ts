import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from './queue.constants';

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

@Injectable()
export class QueueDashboardService {
  private readonly queues: Map<string, Queue>;

  constructor(
    @InjectQueue(QUEUE_NAMES.XML_PROCESSING) private xmlQueue: Queue,
    @InjectQueue(QUEUE_NAMES.OCR_PROCESSING) private ocrQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NFE_DISTRIBUTION) private nfeQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ESOCIAL_EVENTS) private esocialQueue: Queue,
    @InjectQueue(QUEUE_NAMES.CERTIDAO_FETCH) private certidaoQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BANK_RECONCILIATION) private bankQueue: Queue,
    @InjectQueue(QUEUE_NAMES.REPORT_GENERATION) private reportQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION_EMAIL) private emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SPED_TRANSMISSION) private spedQueue: Queue,
  ) {
    this.queues = new Map([
      [QUEUE_NAMES.XML_PROCESSING, xmlQueue],
      [QUEUE_NAMES.OCR_PROCESSING, ocrQueue],
      [QUEUE_NAMES.NFE_DISTRIBUTION, nfeQueue],
      [QUEUE_NAMES.ESOCIAL_EVENTS, esocialQueue],
      [QUEUE_NAMES.CERTIDAO_FETCH, certidaoQueue],
      [QUEUE_NAMES.BANK_RECONCILIATION, bankQueue],
      [QUEUE_NAMES.REPORT_GENERATION, reportQueue],
      [QUEUE_NAMES.NOTIFICATION_EMAIL, emailQueue],
      [QUEUE_NAMES.SPED_TRANSMISSION, spedQueue],
    ]);
  }

  async getAllStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];

    for (const [name, queue] of this.queues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      stats.push({
        name,
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused: await queue.isPaused(),
      });
    }

    return stats;
  }

  async getQueueStats(queueName: string): Promise<QueueStats | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused: await queue.isPaused(),
    };
  }

  async getFailedJobs(queueName: string, start = 0, end = 20) {
    const queue = this.queues.get(queueName);
    if (!queue) return [];

    const jobs = await queue.getFailed(start, end);
    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      finishedOn: job.finishedOn,
    }));
  }

  async retryJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) return false;

    const job = await queue.getJob(jobId);
    if (!job) return false;

    await job.retry();
    return true;
  }

  async cleanQueue(
    queueName: string,
    status: 'completed' | 'failed',
    grace = 0,
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) return 0;

    const removed = await queue.clean(grace, 1000, status);
    return removed.length;
  }
}
