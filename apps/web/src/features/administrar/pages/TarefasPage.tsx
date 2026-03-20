import { useState } from 'react';
import { ListTodo, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/molecules/page-header';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { SegmentedFilter } from '@/components/molecules/segmented-filter';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import {
  TAREFA_STATUS_MAP,
  TAREFA_STATUS_OPTIONS,
  TAREFA_PRIORIDADE_MAP,
  TAREFA_PRIORIDADE_OPTIONS,
} from '@/lib/constants';
import { useTarefas, useCompleteTarefa } from '../hooks/useAdministrar';
import dayjs from 'dayjs';

export function TarefasPage() {
  const [status, setStatus] = useState<string>('');
  const [prioridade, setPrioridade] = useState<string>('');

  const { data: tarefas, isLoading } = useTarefas(
    status || undefined,
    prioridade || undefined,
  );
  const completeTarefa = useCompleteTarefa();

  const columns: Column<any>[] = [
    {
      key: 'titulo',
      header: 'Titulo',
      render: (t) => <span className="font-medium">{t.titulo}</span>,
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      className: 'w-24',
      render: (t) => <StatusBadge status={t.prioridade} statusMap={TAREFA_PRIORIDADE_MAP} />,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (t) => <StatusBadge status={t.status} statusMap={TAREFA_STATUS_MAP} />,
    },
    {
      key: 'prazo',
      header: 'Prazo',
      className: 'w-28',
      hideOnMobile: true,
      render: (t) => (t.prazo ? dayjs(t.prazo).format('DD/MM/YYYY') : '—'),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      className: 'w-28',
      hideOnMobile: true,
      render: (t) => <Badge variant="neutral">{t.categoria}</Badge>,
    },
    {
      key: 'acoes',
      header: '',
      className: 'w-24',
      render: (t) =>
        t.status !== 'concluida' ? (
          <Button
            size="sm"
            onClick={() => completeTarefa.mutate(t._id)}
            disabled={completeTarefa.isPending}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Concluir
          </Button>
        ) : null,
    },
  ];

  const renderMobileCard = (t: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-medium">{t.titulo}</span>
          <StatusBadge status={t.status} statusMap={TAREFA_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          <StatusBadge status={t.prioridade} statusMap={TAREFA_PRIORIDADE_MAP} />
          <Badge variant="neutral">{t.categoria}</Badge>
          {t.prazo && <span>Prazo: {dayjs(t.prazo).format('DD/MM/YYYY')}</span>}
        </>
      }
      actions={
        t.status !== 'concluida' ? (
          <Button
            size="sm"
            onClick={() => completeTarefa.mutate(t._id)}
            disabled={completeTarefa.isPending}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Concluir
          </Button>
        ) : null
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Tarefas" description="Gerenciamento de tarefas do escritorio" />

      <div className="space-y-3">
        <SegmentedFilter
          options={TAREFA_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          allLabel="Todas"
        />
        <SegmentedFilter
          options={TAREFA_PRIORIDADE_OPTIONS}
          value={prioridade}
          onChange={setPrioridade}
          allLabel="Todas Prioridades"
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !tarefas || tarefas.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Nenhuma tarefa encontrada"
          description="Crie tarefas para organizar o trabalho do escritorio"
        />
      ) : (
        <DataTable
          columns={columns}
          data={tarefas}
          keyExtractor={(t: any) => t._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}
