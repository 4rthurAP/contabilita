import { useState } from 'react';
import { Server, RefreshCw, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatCard } from '@/components/molecules/stat-card';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { useQueueStats, useFailedJobs, useRetryJob, useCleanQueue } from '../hooks/useQueues';
import type { QueueStats, FailedJob } from '../services/queue.service';

export function QueuesPage() {
  const { data: queues, isLoading, refetch } = useQueueStats();
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const { data: failedJobs } = useFailedJobs(selectedQueue || '');
  const retryMutation = useRetryJob();
  const cleanMutation = useCleanQueue();

  if (isLoading) return <SkeletonTable rows={5} columns={4} />;

  const totals = (queues || []).reduce(
    (acc, q) => ({
      active: acc.active + q.active,
      waiting: acc.waiting + q.waiting,
      failed: acc.failed + q.failed,
      completed: acc.completed + q.completed,
    }),
    { active: 0, waiting: 0, failed: 0, completed: 0 },
  );

  const queueColumns: Column<QueueStats>[] = [
    { key: 'name', header: 'Fila', render: (q) => <span className="font-mono text-sm">{q.name}</span> },
    { key: 'active', header: 'Ativas', render: (q) => <Badge variant="info">{q.active}</Badge>, hideOnMobile: true },
    { key: 'waiting', header: 'Esperando', render: (q) => q.waiting, hideOnMobile: true },
    { key: 'completed', header: 'Concluidas', render: (q) => q.completed.toLocaleString('pt-BR'), hideOnMobile: true },
    {
      key: 'failed',
      header: 'Falhas',
      render: (q) => q.failed > 0
        ? <Badge variant="danger">{q.failed}</Badge>
        : <span className="text-muted-foreground">0</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (q) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); setSelectedQueue(q.name); }}
            disabled={q.failed === 0}
          >
            <AlertCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              cleanMutation.mutate({ queueName: q.name, status: 'completed' });
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const failedColumns: Column<FailedJob>[] = [
    { key: 'name', header: 'Job', render: (j) => <span className="font-mono text-sm">{j.name}</span> },
    { key: 'failedReason', header: 'Erro', render: (j) => <span className="text-sm text-destructive truncate max-w-xs block">{j.failedReason}</span> },
    { key: 'attempts', header: 'Tentativas', render: (j) => j.attemptsMade, hideOnMobile: true },
    {
      key: 'actions',
      header: '',
      className: 'w-10',
      render: (j) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => retryMutation.mutate({ queueName: selectedQueue!, jobId: j.id })}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Filas de Processamento"
        description="Monitoramento e gerenciamento das filas de processamento assincrono."
        actions={
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Jobs Ativos" value={totals.active} icon={Server} />
        <StatCard title="Esperando" value={totals.waiting} icon={Server} />
        <StatCard title="Concluidos" value={totals.completed.toLocaleString('pt-BR')} icon={Server} />
        <StatCard
          title="Falhas"
          value={totals.failed}
          icon={AlertCircle}
          valueClassName={totals.failed > 0 ? 'text-destructive' : undefined}
        />
      </div>

      {!queues || queues.length === 0 ? (
        <EmptyState icon={Server} title="Nenhuma fila configurada" />
      ) : (
        <DataTable
          columns={queueColumns}
          data={queues}
          keyExtractor={(q) => q.name}
          onRowClick={(q) => q.failed > 0 && setSelectedQueue(q.name)}
        />
      )}

      {selectedQueue && failedJobs && failedJobs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Jobs com falha: <span className="font-mono">{selectedQueue}</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cleanMutation.mutate({ queueName: selectedQueue, status: 'failed' })}
            >
              Limpar todas
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={failedColumns}
              data={failedJobs}
              keyExtractor={(j) => j.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
