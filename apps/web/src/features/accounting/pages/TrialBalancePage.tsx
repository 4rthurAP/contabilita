import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { HelpTooltip } from '@/components/molecules/help-tooltip';
import { GLOSSARY } from '@/lib/accounting-glossary';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { DateRangeFilter } from '@/components/molecules/date-range-filter';
import { FilterBar } from '@/components/organisms/filter-bar';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { useTrialBalance } from '../hooks/useAccounting';
import { TIPO_LABELS } from '@/lib/constants';
import { formatMoeda } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';

function TrialBalanceContent({ companyId }: { companyId: string }) {
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [queryDates, setQueryDates] = useState({ start: startDate, end: endDate });

  const { data, isLoading } = useTrialBalance(companyId, queryDates.start, queryDates.end);

  const trialColumns: Column<any>[] = [
    { key: 'codigo', header: 'Codigo', className: 'w-20', render: (acc) => <span className="font-mono text-xs text-muted-foreground">{acc.codigo}</span> },
    { key: 'nome', header: 'Conta', render: (acc) => acc.nome },
    { key: 'tipo', header: 'Tipo', className: 'w-16', render: (acc) => <span className="text-xs text-muted-foreground">{TIPO_LABELS[acc.tipo] || acc.tipo}</span> },
    { key: 'debit', header: 'Debitos', className: 'text-right font-mono', render: (acc) => formatMoeda(parseFloat(acc.totalDebit)) },
    { key: 'credit', header: 'Creditos', className: 'text-right font-mono', render: (acc) => formatMoeda(parseFloat(acc.totalCredit)) },
    {
      key: 'saldo', header: 'Saldo', className: 'text-right font-mono',
      render: (acc) => (
        <span className={cn(acc.saldoNatureza === 'invertido' && 'text-destructive')}>
          {formatMoeda(Math.abs(parseFloat(acc.saldo)))}
          {acc.saldoNatureza === 'invertido' && ' (inv)'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={<span className="inline-flex items-center gap-2">Balancete de Verificacao <HelpTooltip help={GLOSSARY.balancete} /></span>} description="Lista todas as contas com seus saldos devedores e credores no periodo, verificando o equilibrio da escrituracao" breadcrumbs={[{ label: 'Contabilidade', href: '/app/accounting' }, { label: 'Balancete' }]} />

      <FilterBar>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <Button onClick={() => setQueryDates({ start: startDate, end: endDate })}>
          Consultar
        </Button>
      </FilterBar>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Periodo: {dayjs(queryDates.start).format('DD/MM/YYYY')} a{' '}
            {dayjs(queryDates.end).format('DD/MM/YYYY')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonTable rows={5} columns={4} />
          ) : data?.accounts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lancamento no periodo
            </div>
          ) : (
            <DataTable
              columns={trialColumns}
              data={data?.accounts || []}
              keyExtractor={(acc: any) => acc.accountId}
              footer={data?.totals ? (
                <>
                  <td colSpan={3} className="px-4 py-2.5 text-right">TOTAIS</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatMoeda(parseFloat(data.totals.totalDebit))}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatMoeda(parseFloat(data.totals.totalCredit))}</td>
                  <td className="px-4 py-2.5 text-right">
                    {data.totals.balanced ? (
                      <span className="text-success text-xs">Balanceado</span>
                    ) : (
                      <span className="text-destructive text-xs">Desbalanceado!</span>
                    )}
                  </td>
                </>
              ) : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function TrialBalancePage() {
  return <CompanyRequired>{(companyId) => <TrialBalanceContent companyId={companyId} />}</CompanyRequired>;
}
