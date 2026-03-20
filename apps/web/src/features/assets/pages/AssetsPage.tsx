import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { ASSET_STATUS_MAP } from '@/lib/constants';
import { useAssets, useDepreciateAssets } from '../hooks/useAssets';
import { formatMoeda, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function AssetsContent({ companyId }: { companyId: string }) {
  const { data: assets, isLoading } = useAssets(companyId);
  const now = new Date();
  const depreciate = useDepreciateAssets(companyId);

  const columns: Column<any>[] = [
    { key: 'codigo', header: 'Codigo', className: 'w-20', render: (a) => <span className="font-mono text-muted-foreground">{a.codigo}</span> },
    { key: 'descricao', header: 'Descricao', render: (a) => a.descricao },
    { key: 'status', header: 'Status', className: 'w-24', render: (a) => <StatusBadge status={a.status} statusMap={ASSET_STATUS_MAP} /> },
    { key: 'aquisicao', header: 'Aquisicao', className: 'w-24', hideOnMobile: true, render: (a) => dayjs(a.dataAquisicao).format('DD/MM/YYYY') },
    { key: 'valorAtual', header: 'Valor Atual', className: 'text-right font-mono', render: (a) => formatMoeda(d128(a.valorAtual)) },
  ];

  const renderMobileCard = (asset: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-mono text-muted-foreground">{asset.codigo}</span>
          <span>{asset.descricao}</span>
          <StatusBadge status={asset.status} statusMap={ASSET_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          <span>{asset.grupo}</span>
          <span>Aquisicao: {dayjs(asset.dataAquisicao).format('DD/MM/YYYY')}</span>
          <span>Metodo: {asset.metodoDepreciacao}</span>
          <span>Taxa: {(d128(asset.taxaDepreciacao) * 100).toFixed(0)}% a.a.</span>
        </>
      }
      actions={
        <div className="text-right text-sm">
          <div>Aquisicao: {formatMoeda(d128(asset.valorAquisicao))}</div>
          <div className="text-credit">Deprec.: -{formatMoeda(d128(asset.depreciacaoAcumulada))}</div>
          <div className="font-medium">Atual: {formatMoeda(d128(asset.valorAtual))}</div>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patrimonio"
        description="Controle de bens e depreciacao"
        actions={
          <Button
            onClick={() => depreciate.mutate({ year: now.getFullYear(), month: now.getMonth() + 1 })}
            disabled={depreciate.isPending}
          >
            {depreciate.isPending ? 'Depreciando...' : 'Depreciar Mes Atual'}
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : !assets || assets.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum bem cadastrado" />
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          keyExtractor={(a: any) => a._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function AssetsPage() {
  return <CompanyRequired>{(companyId) => <AssetsContent companyId={companyId} />}</CompanyRequired>;
}
