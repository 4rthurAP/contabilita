import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { SegmentedFilter } from '@/components/molecules/segmented-filter';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { REGISTRO_STATUS_MAP, REGISTRO_STATUS_OPTIONS } from '@/lib/constants';
import { useRegistros } from '../hooks/useRegistro';
import dayjs from 'dayjs';

function RegistroContent({ companyId }: { companyId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<string>('');

  const { data: registros, isLoading } = useRegistros(companyId, status || undefined);

  const columns: Column<any>[] = [
    {
      key: 'tipo',
      header: 'Tipo',
      className: 'w-32',
      render: (reg) => <Badge variant="info">{reg.tipo}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-28',
      render: (reg) => <StatusBadge status={reg.status} statusMap={REGISTRO_STATUS_MAP} />,
    },
    {
      key: 'dataProtocolo',
      header: 'Data Protocolo',
      className: 'w-28',
      render: (reg) =>
        reg.dataProtocolo ? dayjs(reg.dataProtocolo).format('DD/MM/YYYY') : '—',
    },
    {
      key: 'nire',
      header: 'NIRE',
      className: 'w-28',
      hideOnMobile: true,
      render: (reg) => <span className="font-mono">{reg.nire || '—'}</span>,
    },
    {
      key: 'observacoes',
      header: 'Observacoes',
      hideOnMobile: true,
      render: (reg) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {reg.observacoes || '—'}
        </span>
      ),
    },
  ];

  const renderMobileCard = (reg: any) => (
    <ListItemCard
      onClick={() =>
        navigate(`/registro/${reg._id}?companyId=${searchParams.get('companyId')}`)
      }
      title={
        <>
          <Badge variant="info">{reg.tipo}</Badge>
          <StatusBadge status={reg.status} statusMap={REGISTRO_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          {reg.dataProtocolo && (
            <span>Protocolo: {dayjs(reg.dataProtocolo).format('DD/MM/YYYY')}</span>
          )}
          {reg.nire && <span>NIRE: {reg.nire}</span>}
          {reg.observacoes && (
            <span className="truncate max-w-[200px]">{reg.observacoes}</span>
          )}
        </>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registro"
        description="Acompanhamento de registros junto a orgaos publicos"
        actions={
          <Button
            onClick={() =>
              navigate(`/registro/new?companyId=${searchParams.get('companyId')}`)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Registro
          </Button>
        }
      />

      <SegmentedFilter
        options={REGISTRO_STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
        allLabel="Todos"
      />

      {isLoading ? (
        <LoadingState />
      ) : !registros || registros.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum registro encontrado"
          description="Crie um novo registro para comecar o acompanhamento"
        />
      ) : (
        <DataTable
          columns={columns}
          data={registros}
          keyExtractor={(reg: any) => reg._id}
          mobileCard={renderMobileCard}
          onRowClick={(reg) =>
            navigate(`/registro/${reg._id}?companyId=${searchParams.get('companyId')}`)
          }
        />
      )}
    </div>
  );
}

export function RegistroPage() {
  return (
    <CompanyRequired>{(companyId) => <RegistroContent companyId={companyId} />}</CompanyRequired>
  );
}
