import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  useTaxAssessments,
  useRecalculateAssessments,
  useGeneratePayments,
} from '../hooks/useFiscal';
import { formatMoeda } from '@/utils/formatters';

const IMPOSTO_LABELS: Record<string, string> = {
  icms: 'ICMS',
  ipi: 'IPI',
  pis: 'PIS',
  cofins: 'COFINS',
  iss: 'ISS',
  irpj: 'IRPJ',
  csll: 'CSLL',
};

const d128 = (v: any) => parseFloat(v?.$numberDecimal || v || '0');

export function TaxAssessmentPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: assessments, isLoading } = useTaxAssessments(companyId, year, month);
  const recalculate = useRecalculateAssessments(companyId);
  const generatePayments = useGeneratePayments(companyId);

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  const totalRecolher = assessments?.reduce(
    (sum: number, a: any) => sum + d128(a.valorRecolher),
    0,
  ) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Apuracao Fiscal</h1>
          <p className="text-muted-foreground">Apuracao mensal de impostos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => recalculate.mutate({ year, month })}
            disabled={recalculate.isPending}
          >
            <Calculator className="mr-2 h-4 w-4" />
            {recalculate.isPending ? 'Calculando...' : 'Recalcular'}
          </Button>
          <Button
            onClick={() => generatePayments.mutate({ year, month })}
            disabled={generatePayments.isPending}
          >
            <Receipt className="mr-2 h-4 w-4" />
            {generatePayments.isPending ? 'Gerando...' : 'Gerar Guias'}
          </Button>
        </div>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ano</label>
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-24"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mes</label>
          <Input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="w-20"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !assessments || assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma apuracao para {String(month).padStart(2, '0')}/{year}.
            Escriture notas fiscais e recalcule.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Competencia: {String(month).padStart(2, '0')}/{year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Total a recolher: {formatMoeda(totalRecolher)}
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento por imposto */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment: any) => {
              const apurado = d128(assessment.valorApurado);
              const creditos = d128(assessment.creditos);
              const recolher = d128(assessment.valorRecolher);
              return (
                <Card key={assessment._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>{IMPOSTO_LABELS[assessment.tipo] || assessment.tipo}</span>
                      <span className="text-lg">{formatMoeda(recolher)}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Debitos (saidas)</span>
                      <span>{formatMoeda(apurado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creditos (entradas)</span>
                      <span className="text-green-600">-{formatMoeda(creditos)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>A recolher</span>
                      <span>{formatMoeda(recolher)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
