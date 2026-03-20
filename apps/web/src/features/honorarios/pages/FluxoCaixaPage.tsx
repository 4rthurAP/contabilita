import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { useCashFlow } from '../hooks/useHonorarios';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function FluxoCaixaContent({ companyId }: { companyId: string }) {
  const [year, setYear] = useState(dayjs().year());

  const { data: cashFlow, isLoading } = useCashFlow(companyId, year);

  const totalOrcado = cashFlow?.reduce((s: number, item: any) => s + (item.orcado || 0), 0) || 0;
  const totalRealizado = cashFlow?.reduce((s: number, item: any) => s + (item.realizado || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fluxo de Caixa - Honorarios"
        description="Acompanhamento de receita orcada vs realizada"
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
        <LoadingState />
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
                <div className={`text-2xl font-bold ${totalRealizado >= totalOrcado ? 'text-emerald-600' : 'text-destructive'}`}>
                  {formatMoeda(totalRealizado - totalOrcado)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Mes</th>
                      <th className="text-right py-2 px-3 font-medium">Orcado</th>
                      <th className="text-right py-2 px-3 font-medium">Realizado</th>
                      <th className="text-right py-2 px-3 font-medium">Diferenca</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashFlow.map((item: any, idx: number) => {
                      const diff = (item.realizado || 0) - (item.orcado || 0);
                      return (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-2 px-3 font-medium">{MONTHS[idx] || item.mes}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatMoeda(item.orcado || 0)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatMoeda(item.realizado || 0)}</td>
                          <td className={`py-2 px-3 text-right font-mono ${diff >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                            {formatMoeda(diff)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td className="py-2 px-3">Total</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoeda(totalOrcado)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatMoeda(totalRealizado)}</td>
                      <td className={`py-2 px-3 text-right font-mono ${totalRealizado >= totalOrcado ? 'text-emerald-600' : 'text-destructive'}`}>
                        {formatMoeda(totalRealizado - totalOrcado)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export function FluxoCaixaPage() {
  return <CompanyRequired>{(companyId) => <FluxoCaixaContent companyId={companyId} />}</CompanyRequired>;
}
