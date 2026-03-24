import { CreditCard, AlertTriangle, FileText, Users } from 'lucide-react';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { StatCard } from '@/components/molecules/stat-card';
import { StatusBadge } from '@/components/molecules/status-badge';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { PAYMENT_STATUS_MAP, OBLIGATION_STATUS_MAP } from '@/lib/constants';
import { usePortalSummary, usePortalPayments, usePortalObligations } from '../hooks/useClientPortal';
import { formatMoeda, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function ClientPortalContent({ companyId }: { companyId: string }) {
  const { data: summary, isLoading: loadingSummary } = usePortalSummary(companyId);
  const { data: payments, isLoading: loadingPayments } = usePortalPayments(companyId);
  const { data: obligations, isLoading: loadingObligations } = usePortalObligations(companyId);

  const paymentColumns: Column<any>[] = [
    { key: 'guia', header: 'Guia', className: 'w-20', render: (p) => <span className="font-mono font-bold">{p.tipoGuia}</span> },
    { key: 'tipo', header: 'Tipo', className: 'w-16', render: (p) => p.tipo.toUpperCase() },
    { key: 'competencia', header: 'Competencia', className: 'w-24', hideOnMobile: true, render: (p) => p.competencia },
    { key: 'vencimento', header: 'Vencimento', className: 'w-24', render: (p) => dayjs(p.dataVencimento).format('DD/MM/YYYY') },
    { key: 'valor', header: 'Valor', className: 'text-right font-mono', render: (p) => formatMoeda(d128(p.valorTotal)) },
    { key: 'status', header: 'Status', className: 'w-24', render: (p) => <StatusBadge status={p.status} statusMap={PAYMENT_STATUS_MAP} /> },
  ];

  const obligationColumns: Column<any>[] = [
    { key: 'tipo', header: 'Tipo', className: 'w-28', render: (o) => <span className="font-mono font-bold">{o.tipo}</span> },
    { key: 'competencia', header: 'Competencia', className: 'w-24', render: (o) => o.competencia },
    { key: 'prazo', header: 'Prazo', className: 'w-24', render: (o) => dayjs(o.prazoEntrega).format('DD/MM/YYYY') },
    { key: 'status', header: 'Status', className: 'w-24', render: (o) => <StatusBadge status={o.status} statusMap={OBLIGATION_STATUS_MAP} /> },
  ];

  if (loadingSummary) return <SkeletonTable rows={5} columns={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal do Cliente"
        description="Acompanhamento de guias, obrigacoes e folha de pagamento"
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Guias Pendentes"
          value={summary?.pendingPayments ?? 0}
          icon={CreditCard}
        />
        <StatCard
          title="Guias Vencidas"
          value={summary?.overduePayments ?? 0}
          icon={AlertTriangle}
          valueClassName="text-destructive"
        />
        <StatCard
          title="Obrigacoes Pendentes"
          value={summary?.pendingObligations ?? 0}
          icon={FileText}
        />
        <StatCard
          title="Folhas Recentes"
          value={summary?.recentPayrolls?.length ?? 0}
          icon={Users}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Guias de Pagamento</h3>
        {loadingPayments ? (
          <SkeletonTable rows={5} columns={4} />
        ) : !payments || payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma guia encontrada
          </div>
        ) : (
          <DataTable
            columns={paymentColumns}
            data={payments}
            keyExtractor={(p: any) => p._id}
          />
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Obrigacoes Acessorias</h3>
        {loadingObligations ? (
          <SkeletonTable rows={5} columns={4} />
        ) : !obligations || obligations.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma obrigacao encontrada
          </div>
        ) : (
          <DataTable
            columns={obligationColumns}
            data={obligations}
            keyExtractor={(o: any) => o._id}
          />
        )}
      </div>
    </div>
  );
}

export function ClientPortalPage() {
  return (
    <CompanyRequired>{(companyId) => <ClientPortalContent companyId={companyId} />}</CompanyRequired>
  );
}
