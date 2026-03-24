import { useState } from 'react';
import { Calculator, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { HelpTooltip } from '@/components/molecules/help-tooltip';
import { GLOSSARY } from '@/lib/accounting-glossary';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonCards } from '@/components/molecules/skeleton-cards';
import { YearMonthFilter } from '@/components/molecules/year-month-filter';
import { FilterBar } from '@/components/organisms/filter-bar';
import { IMPOSTO_LABELS } from '@/lib/constants';
import { useTaxAssessments, useRecalculateAssessments, useGeneratePayments } from '../hooks/useFiscal';
import { formatMoeda, d128 } from '@/utils/formatters';

function TaxAssessmentContent({ companyId }: { companyId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: assessments, isLoading } = useTaxAssessments(companyId, year, month);
  const recalculate = useRecalculateAssessments(companyId);
  const generatePayments = useGeneratePayments(companyId);

  const totalRecolher = assessments?.reduce((sum: number, a: any) => sum + d128(a.valorRecolher), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="inline-flex items-center gap-2">Apuracao Fiscal <HelpTooltip help={GLOSSARY.apuracaoFiscal} /></span>}
        description="Calculo mensal dos impostos devidos com base nas notas fiscais de entrada e saida"
        breadcrumbs={[{ label: 'Escrita Fiscal', href: '/app/fiscal/invoices' }, { label: 'Apuracao' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => recalculate.mutate({ year, month })} loading={recalculate.isPending}>
              <Calculator className="mr-2 h-4 w-4" />
              Recalcular
            </Button>
            <Button onClick={() => generatePayments.mutate({ year, month })} loading={generatePayments.isPending}>
              <Receipt className="mr-2 h-4 w-4" />
              Gerar Guias
            </Button>
          </div>
        }
      />

      <FilterBar>
        <YearMonthFilter year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
      </FilterBar>

      {isLoading ? (
        <SkeletonCards count={6} />
      ) : !assessments || assessments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma apuracao para {String(month).padStart(2, '0')}/{year}. Escriture notas fiscais e recalcule.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Competencia: {String(month).padStart(2, '0')}/{year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Total a recolher: {formatMoeda(totalRecolher)}</div>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                      <span className="text-success">-{formatMoeda(creditos)}</span>
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

export function TaxAssessmentPage() {
  return <CompanyRequired>{(companyId) => <TaxAssessmentContent companyId={companyId} />}</CompanyRequired>;
}
