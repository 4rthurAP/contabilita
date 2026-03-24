import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { useCashFlow } from '../hooks/useHonorarios';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function FluxoCaixaContent({ companyId }: { companyId: string }) {
  const [year, setYear] = useState(dayjs().year());

  const { data: cashFlow, isLoading } = useCashFlow(companyId, year);

  const totalOrcado = cashFlow?.reduce((s: number, item: any) => s + (item.orcado || 0), 0) || 0;
  const totalRealizado = cashFlow?.reduce((s: number, item: any) => s + (item.realizado || 0), 0) || 0;
  const diff = totalRealizado - totalOrcado;

  // Enrich data with index for display
  const enrichedData = (cashFlow || []).map((item: any, idx: number) => ({
    ...item,
    _idx: idx,
    _diff: (item.realizado || 0) - (item.orcado || 0),
  }));

  const columns: Column<any>[] = [
    { key: 'mes', header: 'Mes', render: (item) => MONTHS[item._idx] || item.mes },
    { key: 'orcado', header: 'Orcado', className: 'text-right font-mono', render: (item) => formatMoeda(item.orcado || 0) },
    { key: 'realizado', header: 'Realizado', className: 'text-right font-mono', render: (item) => formatMoeda(item.realizado || 0) },
    {
      key: 'diferenca',
      header: 'Diferenca',
      className: 'text-right font-mono',
      render: (item) => (
        <span className={item._diff >= 0 ? 'text-success' : 'text-destructive'}>{formatMoeda(item._diff)}</span>
      ),
    },
  ];

  const renderMobileCard = (item: any) => (
    <ListItemCard
      title={<span className="font-medium">{MONTHS[item._idx] || item.mes}</span>}
      subtitle={
        <>
          <span>Orcado: {formatMoeda(item.orcado || 0)}</span>
          <span>Realizado: {formatMoeda(item.realizado || 0)}</span>
        </>
      }
      actions={
        <span className={`font-mono text-sm ${item._diff >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatMoeda(item._diff)}
        </span>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fluxo de Caixa - Honorarios"
        description="Acompanhamento de receita orcada vs realizada"
        breadcrumbs={[{ label: 'Honorarios', href: '/app/honorarios/contratos' }, { label: 'Fluxo de Caixa' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setYear(year - 1)}>
              &larr;
            </Button>
            <span className="text-sm font-medium w-12 text-center">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear(year + 1)}>
              &rarr;
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : !cashFlow || cashFlow.length === 0 ? (
        <EmptyState icon={TrendingUp} title="Sem dados de fluxo de caixa" description="Os dados serao preenchidos conforme cobrancas forem geradas" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orcado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoeda(totalOrcado)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Realizado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatMoeda(totalRealizado)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Diferenca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${diff >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatMoeda(diff)}
                </div>
              </CardContent>
            </Card>
          </div>

          <DataTable
            columns={columns}
            data={enrichedData}
            keyExtractor={(item: any) => `month-${item._idx}`}
            mobileCard={renderMobileCard}
          />
        </>
      )}
    </div>
  );
}

export function FluxoCaixaPage() {
  return <CompanyRequired>{(companyId) => <FluxoCaixaContent companyId={companyId} />}</CompanyRequired>;
}
