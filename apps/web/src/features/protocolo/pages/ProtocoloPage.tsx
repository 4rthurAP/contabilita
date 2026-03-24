import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { SegmentedFilter } from '@/components/molecules/segmented-filter';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { PROTOCOLO_STATUS_MAP, PROTOCOLO_STATUS_OPTIONS, PROTOCOLO_TIPO_MAP } from '@/lib/constants';
import { useProtocolos } from '../hooks/useProtocolo';
import dayjs from 'dayjs';

function ProtocoloContent({ companyId }: { companyId: string }) {
  const [status, setStatus] = useState<string>('');

  const { data: protocolos, isLoading } = useProtocolos(companyId, status || undefined);

  const columns: Column<any>[] = [
    { key: 'numero', header: 'Numero', className: 'w-28', render: (p) => <span className="font-mono font-medium">{p.numero}</span> },
    { key: 'tipo', header: 'Tipo', className: 'w-32', render: (p) => <StatusBadge status={p.tipo} statusMap={PROTOCOLO_TIPO_MAP} /> },
    { key: 'data', header: 'Data', className: 'w-28', render: (p) => dayjs(p.data).format('DD/MM/YYYY') },
    { key: 'descricao', header: 'Descricao', render: (p) => p.descricao || '—' },
    { key: 'remetente', header: 'Remetente', className: 'w-32', hideOnMobile: true, render: (p) => p.remetente || '—' },
    { key: 'destinatario', header: 'Destinatario', className: 'w-32', hideOnMobile: true, render: (p) => p.destinatario || '—' },
    { key: 'status', header: 'Status', className: 'w-28', render: (p) => <StatusBadge status={p.status} statusMap={PROTOCOLO_STATUS_MAP} /> },
  ];

  const renderMobileCard = (p: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-mono font-medium">{p.numero}</span>
          <StatusBadge status={p.tipo} statusMap={PROTOCOLO_TIPO_MAP} />
          <StatusBadge status={p.status} statusMap={PROTOCOLO_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          <span>{dayjs(p.data).format('DD/MM/YYYY')}</span>
          {p.descricao && <span>{p.descricao}</span>}
          {p.remetente && <span>De: {p.remetente}</span>}
          {p.destinatario && <span>Para: {p.destinatario}</span>}
        </>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Protocolos" description="Controle de documentos recebidos e enviados" />

      <SegmentedFilter options={PROTOCOLO_STATUS_OPTIONS} value={status} onChange={setStatus} />

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : !protocolos || protocolos.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhum protocolo encontrado" description="Cadastre um protocolo para comecar o controle" />
      ) : (
        <DataTable
          columns={columns}
          data={protocolos}
          keyExtractor={(p: any) => p._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function ProtocoloPage() {
  return <CompanyRequired>{(companyId) => <ProtocoloContent companyId={companyId} />}</CompanyRequired>;
}
