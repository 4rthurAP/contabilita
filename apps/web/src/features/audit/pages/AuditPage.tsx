import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/molecules/page-header';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { Pagination } from '@/components/molecules/pagination';
import { StatusBadge } from '@/components/molecules/status-badge';
import { FilterBar } from '@/components/organisms/filter-bar';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { AUDIT_ACTION_MAP } from '@/lib/constants';
import { useAuditLogs } from '../hooks/useAudit';
import dayjs from 'dayjs';

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');

  const { data, isLoading } = useAuditLogs(page, resource || undefined);

  const columns: Column<any>[] = [
    { key: 'data', header: 'Data', className: 'w-28', render: (log) => <span className="text-xs">{dayjs(log.createdAt).format('DD/MM/YY HH:mm')}</span> },
    { key: 'acao', header: 'Acao', className: 'w-20', render: (log) => <StatusBadge status={log.action} statusMap={AUDIT_ACTION_MAP} /> },
    { key: 'recurso', header: 'Recurso', className: 'w-28', render: (log) => <span className="font-mono text-sm">{log.resource}</span> },
    { key: 'descricao', header: 'Descricao', hideOnMobile: true, render: (log) => <span className="text-sm text-muted-foreground">{log.description}</span> },
    { key: 'usuario', header: 'Usuario', className: 'w-28', hideOnMobile: true, render: (log) => <span className="text-xs text-muted-foreground">{log.userName || 'Sistema'}</span> },
  ];

  const renderMobileCard = (log: any) => (
    <ListItemCard
      title={
        <>
          <span className="text-xs text-muted-foreground">{dayjs(log.createdAt).format('DD/MM/YY HH:mm')}</span>
          <StatusBadge status={log.action} statusMap={AUDIT_ACTION_MAP} />
          <span className="font-mono">{log.resource}</span>
        </>
      }
      subtitle={
        <>
          {log.description && <span>{log.description}</span>}
          <span>{log.userName || 'Sistema'}</span>
          {log.changedFields?.length > 0 && <span>({log.changedFields.join(', ')})</span>}
        </>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Auditoria" description="Trilha completa de operacoes do sistema" />

      <FilterBar>
        <div className="space-y-1">
          <Label className="text-xs">Filtrar recurso</Label>
          <Input
            placeholder="Ex: Company, JournalEntry..."
            value={resource}
            onChange={(e) => { setResource(e.target.value); setPage(1); }}
            className="w-full sm:w-60"
          />
        </div>
      </FilterBar>

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : !data?.data || data.data.length === 0 ? (
        <EmptyState icon={Shield} title="Nenhum registro de auditoria" />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data.data}
            keyExtractor={(log: any) => log._id}
            mobileCard={renderMobileCard}
          />
          <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
