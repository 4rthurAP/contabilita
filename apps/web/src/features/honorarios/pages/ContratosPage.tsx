import { useState } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { SegmentedFilter } from '@/components/molecules/segmented-filter';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { CONTRATO_STATUS_MAP, CONTRATO_STATUS_OPTIONS } from '@/lib/constants';
import { useContratos } from '../hooks/useHonorarios';
import { formatMoeda, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function ContratosContent({ companyId }: { companyId: string }) {
  const [status, setStatus] = useState<string>('');

  const { data: contratos, isLoading } = useContratos(companyId, status || undefined);

  const columns: Column<any>[] = [
    { key: 'descricao', header: 'Descricao', render: (c) => <span className="font-medium">{c.descricao}</span> },
    { key: 'empresa', header: 'Empresa', hideOnMobile: true, render: (c) => c.empresaNome || '—' },
    { key: 'valorMensal', header: 'Valor Mensal', className: 'text-right font-mono', render: (c) => formatMoeda(d128(c.valorMensal)) },
    { key: 'periodicidade', header: 'Periodicidade', className: 'w-28', hideOnMobile: true, render: (c) => <span className="text-xs capitalize">{c.periodicidade}</span> },
    { key: 'dataInicio', header: 'Inicio', className: 'w-24', hideOnMobile: true, render: (c) => dayjs(c.dataInicio).format('DD/MM/YYYY') },
    { key: 'status', header: 'Status', className: 'w-24', render: (c) => <StatusBadge status={c.status} statusMap={CONTRATO_STATUS_MAP} /> },
  ];

  const renderMobileCard = (c: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-medium">{c.descricao}</span>
          <StatusBadge status={c.status} statusMap={CONTRATO_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          {c.empresaNome && <span>{c.empresaNome}</span>}
          <span className="capitalize">{c.periodicidade}</span>
          <span>Inicio: {dayjs(c.dataInicio).format('DD/MM/YYYY')}</span>
        </>
      }
      actions={
        <div className="text-right">
          <div className="text-sm font-medium">{formatMoeda(d128(c.valorMensal))}</div>
          <div className="text-xs text-muted-foreground">por mes</div>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Contratos de Honorarios" description="Gestao de contratos de prestacao de servicos contabeis" />

      <SegmentedFilter options={CONTRATO_STATUS_OPTIONS} value={status} onChange={setStatus} />

      {isLoading ? (
        <LoadingState />
      ) : !contratos || contratos.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum contrato cadastrado" description="Cadastre um contrato para comecar" />
      ) : (
        <DataTable
          columns={columns}
          data={contratos}
          keyExtractor={(c: any) => c._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function ContratosPage() {
  return <CompanyRequired>{(companyId) => <ContratosContent companyId={companyId} />}</CompanyRequired>;
}
