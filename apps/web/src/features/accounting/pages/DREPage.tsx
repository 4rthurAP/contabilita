import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { DateRangeFilter } from '@/components/molecules/date-range-filter';
import { FilterBar } from '@/components/organisms/filter-bar';
import { useDre } from '@/features/reports/hooks/useReports';
import { DRELine } from '../components/dre-line';
import dayjs from 'dayjs';

function DREContent({ companyId }: { companyId: string }) {
  const [startDate, setStartDate] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [query, setQuery] = useState({ start: startDate, end: endDate });

  const { data, isLoading } = useDre(companyId, query.start, query.end);

  return (
    <div className="space-y-6">
      <PageHeader title="DRE - Demonstracao do Resultado" />

      <FilterBar>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <Button onClick={() => setQuery({ start: startDate, end: endDate })}>Gerar</Button>
      </FilterBar>

      {isLoading ? (
        <LoadingState />
      ) : data && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">
              Periodo: {dayjs(query.start).format('DD/MM/YYYY')} a {dayjs(query.end).format('DD/MM/YYYY')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DRELine label="RECEITA BRUTA" value={data.receitas?.total || '0'} bold />
            {data.receitas?.accounts?.map((a: any) => (
              <DRELine key={a.accountId} label={a.nome} value={a.saldo} indent />
            ))}

            <DRELine label="(-) CUSTOS" value={`-${data.custos?.total || '0'}`} bold />
            {data.custos?.accounts?.map((a: any) => (
              <DRELine key={a.accountId} label={a.nome} value={`-${a.saldo}`} indent />
            ))}

            <DRELine label="= LUCRO BRUTO" value={data.lucroBruto} bold />

            <DRELine label="(-) DESPESAS OPERACIONAIS" value={`-${data.despesas?.total || '0'}`} bold />
            {data.despesas?.accounts?.map((a: any) => (
              <DRELine key={a.accountId} label={a.nome} value={`-${a.saldo}`} indent />
            ))}

            <div className="border-t border-border mt-2 pt-2">
              <DRELine label="= RESULTADO LIQUIDO" value={data.resultadoLiquido} bold />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function DREPage() {
  return <CompanyRequired>{(companyId) => <DREContent companyId={companyId} />}</CompanyRequired>;
}
