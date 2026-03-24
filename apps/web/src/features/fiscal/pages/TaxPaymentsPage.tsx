import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { StatusBadge } from '@/components/molecules/status-badge';
import { SegmentedFilter } from '@/components/molecules/segmented-filter';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { PAYMENT_STATUS_MAP, PAYMENT_STATUS_OPTIONS } from '@/lib/constants';
import { useTaxPayments, useMarkPaid } from '../hooks/useFiscal';
import { formatMoeda, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function TaxPaymentsContent({ companyId }: { companyId: string }) {
  const [statusFilter, setStatusFilter] = useState('');
  const { data: payments, isLoading } = useTaxPayments(companyId, statusFilter || undefined);
  const markPaid = useMarkPaid(companyId);

  const columns: Column<any>[] = [
    { key: 'guia', header: 'Guia', className: 'w-20', render: (p) => <span className="font-mono font-bold">{p.tipoGuia}</span> },
    { key: 'tipo', header: 'Tipo', className: 'w-16', render: (p) => p.tipo.toUpperCase() },
    { key: 'competencia', header: 'Competencia', className: 'w-24', hideOnMobile: true, render: (p) => p.competencia },
    { key: 'vencimento', header: 'Vencimento', className: 'w-24', render: (p) => dayjs(p.dataVencimento).format('DD/MM/YYYY') },
    { key: 'valor', header: 'Valor', className: 'text-right font-mono', render: (p) => formatMoeda(d128(p.valorTotal)) },
    { key: 'status', header: 'Status', className: 'w-24', render: (p) => <StatusBadge status={p.status} statusMap={PAYMENT_STATUS_MAP} /> },
    {
      key: 'acoes', header: '', className: 'w-20',
      render: (p) => p.status === 'pendente' ? (
        <Button size="sm" variant="outline" onClick={() => markPaid.mutate(p._id)} disabled={markPaid.isPending}>
          <Check className="mr-1 h-3.5 w-3.5" />
          Pagar
        </Button>
      ) : null,
    },
  ];

  const renderMobileCard = (payment: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-mono font-bold">{payment.tipoGuia}</span>
          <span>{payment.tipo.toUpperCase()}</span>
          <StatusBadge status={payment.status} statusMap={PAYMENT_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          <span>Competencia: {payment.competencia}</span>
          <span>Vencimento: {dayjs(payment.dataVencimento).format('DD/MM/YYYY')}</span>
          {payment.codigoReceita && <span>Cod. Receita: {payment.codigoReceita}</span>}
        </>
      }
      actions={
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">{formatMoeda(d128(payment.valorTotal))}</div>
          {payment.status === 'pendente' && (
            <Button size="sm" variant="outline" onClick={() => markPaid.mutate(payment._id)} disabled={markPaid.isPending}>
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
      <PageHeader title="Guias de Pagamento" description="DARF, DAS, ISS e outras guias" breadcrumbs={[{ label: 'Escrita Fiscal', href: '/app/fiscal/invoices' }, { label: 'Guias' }]} />

      <SegmentedFilter options={PAYMENT_STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : !payments || payments.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-muted-foreground">
            Nenhuma guia encontrada. Apure impostos e gere as guias.
          </div>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={payments}
          keyExtractor={(p: any) => p._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function TaxPaymentsPage() {
  return <CompanyRequired>{(companyId) => <TaxPaymentsContent companyId={companyId} />}</CompanyRequired>;
}
