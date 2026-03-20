import { useState } from 'react';
import { FileText, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { Pagination } from '@/components/molecules/pagination';
import { StatusBadge } from '@/components/molecules/status-badge';
import { SegmentedFilter } from '@/components/molecules/segmented-filter';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { INVOICE_STATUS_MAP, INVOICE_TIPO_OPTIONS } from '@/lib/constants';
import { useInvoices, usePostInvoice, useImportXml } from '../hooks/useFiscal';
import { formatMoeda, formatCnpj, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function InvoicesContent({ companyId }: { companyId: string }) {
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<string>('');

  const { data, isLoading } = useInvoices(companyId, page, tipo || undefined);
  const postInvoice = usePostInvoice(companyId);
  const importXml = useImportXml(companyId);

  const handleImportXml = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const xml = await file.text();
      importXml.mutate(xml);
    };
    input.click();
  };

  const columns: Column<any>[] = [
    { key: 'numero', header: 'NF', className: 'w-24', render: (inv) => <span className="font-mono">NF {inv.numero}/{inv.serie}</span> },
    { key: 'data', header: 'Data', className: 'w-24', render: (inv) => dayjs(inv.dataEmissao).format('DD/MM/YYYY') },
    { key: 'tipo', header: 'Tipo', className: 'w-16', hideOnMobile: true, render: (inv) => <span className="text-xs uppercase">{inv.tipo}</span> },
    { key: 'fornecedor', header: 'Fornecedor/Cliente', hideOnMobile: true, render: (inv) => inv.fornecedorClienteNome || '—' },
    { key: 'valor', header: 'Valor', className: 'text-right font-mono', render: (inv) => formatMoeda(d128(inv.totalNota)) },
    { key: 'status', header: 'Status', className: 'w-24', render: (inv) => <StatusBadge status={inv.status} statusMap={INVOICE_STATUS_MAP} /> },
    {
      key: 'acoes', header: '', className: 'w-24',
      render: (inv) => inv.status === 'rascunho' ? (
        <Button size="sm" onClick={() => postInvoice.mutate(inv._id)} disabled={postInvoice.isPending}>
          <Check className="mr-1 h-3.5 w-3.5" />
          Escriturar
        </Button>
      ) : null,
    },
  ];

  const renderMobileCard = (inv: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-mono">NF {inv.numero}/{inv.serie}</span>
          <StatusBadge status={inv.status} statusMap={INVOICE_STATUS_MAP} />
          <span className="text-xs text-muted-foreground uppercase">{inv.tipo}</span>
        </>
      }
      subtitle={
        <>
          <span>{dayjs(inv.dataEmissao).format('DD/MM/YYYY')}</span>
          {inv.fornecedorClienteNome && <span>{inv.fornecedorClienteNome}</span>}
          {inv.fornecedorClienteCnpj && <span>{formatCnpj(inv.fornecedorClienteCnpj)}</span>}
        </>
      }
      actions={
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium">{formatMoeda(d128(inv.totalNota))}</div>
            <div className="text-xs text-muted-foreground">
              ICMS: {formatMoeda(d128(inv.totalIcms))} | PIS: {formatMoeda(d128(inv.totalPis))} | COFINS: {formatMoeda(d128(inv.totalCofins))}
            </div>
          </div>
          {inv.status === 'rascunho' && (
            <Button size="sm" onClick={() => postInvoice.mutate(inv._id)} disabled={postInvoice.isPending}>
              <Check className="mr-1 h-3.5 w-3.5" />
              Escriturar
            </Button>
          )}
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notas Fiscais"
        description="Escrituracao de notas fiscais de entrada e saida"
        actions={
          <Button variant="outline" onClick={handleImportXml} disabled={importXml.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {importXml.isPending ? 'Importando...' : 'Importar XML'}
          </Button>
        }
      />

      <SegmentedFilter options={INVOICE_TIPO_OPTIONS} value={tipo} onChange={setTipo} />

      {isLoading ? (
        <LoadingState />
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma nota fiscal"
          description="Importe um XML de NF-e para comecar"
        />
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={data?.data || []}
            keyExtractor={(inv: any) => inv._id}
            mobileCard={renderMobileCard}
          />
          <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

export function InvoicesPage() {
  return <CompanyRequired>{(companyId) => <InvoicesContent companyId={companyId} />}</CompanyRequired>;
}
