import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

export function TaxUpdatePage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';

  const { data: overdue, isLoading } = useQuery({
    queryKey: ['tax-update', companyId],
    queryFn: () => api.get(`/companies/${companyId}/tax-update/overdue`).then((r) => r.data),
    enabled: !!companyId,
  });

  if (!companyId) return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;

  const totalAtualizado = overdue?.reduce((s: number, t: any) => s + parseFloat(t.totalAtualizado), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Impostos em Atraso</h1>
        <p className="text-muted-foreground">Calculo de multa e juros SELIC sobre impostos vencidos</p>
      </div>

      {totalAtualizado > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-700">{formatMoeda(totalAtualizado)}</div>
                <p className="text-sm text-red-600">Total atualizado com multa + juros SELIC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !overdue || overdue.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-700">Nenhum imposto em atraso</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {overdue.map((tax: any) => (
            <Card key={tax._id} className="border-red-200">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm flex items-center gap-3">
                      <span className="font-mono font-bold">{tax.tipoGuia}</span>
                      <span>{tax.tipo.toUpperCase()}</span>
                      <span className="text-xs text-red-600">{tax.diasAtraso} dias em atraso</span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      Competencia: {tax.competencia} | Vencimento: {dayjs(tax.dataVencimento).format('DD/MM/YYYY')}
                    </div>
                  </div>
                  <div className="text-right text-sm space-y-0.5">
                    <div className="text-muted-foreground">Principal: {formatMoeda(parseFloat(tax.valorPrincipal))}</div>
                    <div className="text-red-600">Multa: +{formatMoeda(parseFloat(tax.multa))}</div>
                    <div className="text-red-600">Juros SELIC: +{formatMoeda(parseFloat(tax.juros))}</div>
                    <div className="font-bold text-red-700">Total: {formatMoeda(parseFloat(tax.totalAtualizado))}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
