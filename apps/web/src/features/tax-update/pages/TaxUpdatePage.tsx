import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { useOverdueTaxes } from '../hooks/useTaxUpdate';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

function TaxUpdateContent({ companyId }: { companyId: string }) {
  const { data: overdue, isLoading } = useOverdueTaxes(companyId);

  const totalAtualizado = overdue?.reduce((s: number, t: any) => s + parseFloat(t.totalAtualizado), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Impostos em Atraso" description="Calculo de multa e juros SELIC sobre impostos vencidos" />

      {totalAtualizado > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">{formatMoeda(totalAtualizado)}</div>
                <p className="text-sm text-destructive/80">Total atualizado com multa + juros SELIC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : !overdue || overdue.length === 0 ? (
        <EmptyState icon={Clock} title="Nenhum imposto em atraso" />
      ) : (
        <div className="space-y-3">
          {overdue.map((tax: any) => (
            <ListItemCard
              key={tax._id}
              className="border-destructive/30"
              title={
                <>
                  <span className="font-mono font-bold">{tax.tipoGuia}</span>
                  <span>{tax.tipo.toUpperCase()}</span>
                  <span className="text-xs text-destructive">{tax.diasAtraso} dias em atraso</span>
                </>
              }
              subtitle={
                <span>Competencia: {tax.competencia} | Vencimento: {dayjs(tax.dataVencimento).format('DD/MM/YYYY')}</span>
              }
              actions={
                <div className="text-right text-sm space-y-0.5">
                  <div className="text-muted-foreground">Principal: {formatMoeda(parseFloat(tax.valorPrincipal))}</div>
                  <div className="text-destructive">Multa: +{formatMoeda(parseFloat(tax.multa))}</div>
                  <div className="text-destructive">Juros SELIC: +{formatMoeda(parseFloat(tax.juros))}</div>
                  <div className="font-bold text-destructive">Total: {formatMoeda(parseFloat(tax.totalAtualizado))}</div>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaxUpdatePage() {
  return <CompanyRequired>{(companyId) => <TaxUpdateContent companyId={companyId} />}</CompanyRequired>;
}
