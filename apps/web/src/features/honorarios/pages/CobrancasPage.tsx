import { useState } from 'react';
import { Receipt, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { SegmentedFilter } from '@/components/molecules/segmented-filter';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { COBRANCA_STATUS_MAP, COBRANCA_STATUS_OPTIONS } from '@/lib/constants';
import { useCobrancas, useMarkCobrancaPaid, useGenerateBilling } from '../hooks/useHonorarios';
import { formatMoeda, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function CobrancasContent({ companyId }: { companyId: string }) {
  const [status, setStatus] = useState<string>('');

  const { data: cobrancas, isLoading } = useCobrancas(companyId, status ? { status } : undefined);
  const markPaid = useMarkCobrancaPaid(companyId);
  const generateBilling = useGenerateBilling(companyId);

  const handleGenerate = () => {
    const now = dayjs();
    generateBilling.mutate({ year: now.year(), month: now.month() + 1 });
  };

  const columns: Column<any>[] = [
    { key: 'competencia', header: 'Competencia', className: 'w-24', render: (c) => <span className="font-mono">{c.competencia}</span> },
    { key: 'empresa', header: 'Empresa', hideOnMobile: true, render: (c) => c.empresaNome || '—' },
    { key: 'valor', header: 'Valor', className: 'text-right font-mono', render: (c) => formatMoeda(d128(c.valor)) },
    { key: 'dataVencimento', header: 'Vencimento', className: 'w-28', render: (c) => dayjs(c.dataVencimento).format('DD/MM/YYYY') },
    { key: 'formaPagamento', header: 'Pagamento', className: 'w-24', hideOnMobile: true, render: (c) => <span className="text-xs capitalize">{c.formaPagamento || '—'}</span> },
    { key: 'status', header: 'Status', className: 'w-24', render: (c) => <StatusBadge status={c.status} statusMap={COBRANCA_STATUS_MAP} /> },
    {
      key: 'acoes', header: '', className: 'w-24',
      render: (c) => c.status === 'pendente' ? (
        <Button size="sm" onClick={() => markPaid.mutate(c._id)} disabled={markPaid.isPending}>
          <Check className="mr-1 h-3.5 w-3.5" />
          Pagar
        </Button>
      ) : null,
    },
  ];

  const renderMobileCard = (c: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-mono">{c.competencia}</span>
          <StatusBadge status={c.status} statusMap={COBRANCA_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          {c.empresaNome && <span>{c.empresaNome}</span>}
          <span>Vencimento: {dayjs(c.dataVencimento).format('DD/MM/YYYY')}</span>
          {c.formaPagamento && <span className="capitalize">{c.formaPagamento}</span>}
        </>
      }
      actions={
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">{formatMoeda(d128(c.valor))}</div>
          </div>
          {c.status === 'pendente' && (
            <Button size="sm" onClick={() => markPaid.mutate(c._id)} disabled={markPaid.isPending}>
              <Check className="mr-1 h-3.5 w-3.5" />
              Pagar
            </Button>
          )}
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobrancas"
        description="Acompanhamento de cobrancas de honorarios"
        actions={
          <Button variant="outline" onClick={handleGenerate} disabled={generateBilling.isPending}>
            {generateBilling.isPending ? 'Gerando...' : 'Gerar Cobrancas'}
          </Button>
        }
      />

      <SegmentedFilter options={COBRANCA_STATUS_OPTIONS} value={status} onChange={setStatus} />

      {isLoading ? (
        <LoadingState />
      ) : !cobrancas || cobrancas.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma cobranca encontrada" description="Gere cobrancas a partir dos contratos ativos" />
      ) : (
        <DataTable
          columns={columns}
          data={cobrancas}
          keyExtractor={(c: any) => c._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function CobrancasPage() {
  return <CompanyRequired>{(companyId) => <CobrancasContent companyId={companyId} />}</CompanyRequired>;
}
