import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { DateRangeFilter } from '@/components/molecules/date-range-filter';
import { FilterBar } from '@/components/organisms/filter-bar';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { useAnalyticalAccounts, useLedger } from '../hooks/useAccounting';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

function LedgerContent({ companyId }: { companyId: string }) {
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [query, setQuery] = useState({ accountId: '', start: '', end: '' });

  const { data: accounts } = useAnalyticalAccounts(companyId);
  const { data: ledger, isLoading } = useLedger(companyId, query.accountId, query.start, query.end);

  const handleConsultar = () => {
    if (accountId && startDate && endDate) {
      setQuery({ accountId, start: startDate, end: endDate });
    }
  };

  const ledgerColumns: Column<any>[] = [
    { key: 'date', header: 'Data', className: 'w-16', render: (mov) => <span className="text-xs">{dayjs(mov.date).format('DD/MM')}</span> },
    { key: 'numero', header: 'No', className: 'w-16', render: (mov) => <span className="font-mono text-xs text-muted-foreground">#{mov.numero}</span> },
    { key: 'historico', header: 'Historico', render: (mov) => <span className="text-xs">{mov.historico}</span> },
    { key: 'debit', header: 'Debito', className: 'text-right font-mono', render: (mov) => parseFloat(mov.debit) > 0 ? formatMoeda(parseFloat(mov.debit)) : '—' },
    { key: 'credit', header: 'Credito', className: 'text-right font-mono', render: (mov) => parseFloat(mov.credit) > 0 ? formatMoeda(parseFloat(mov.credit)) : '—' },
    { key: 'saldo', header: 'Saldo', className: 'text-right font-mono', render: (mov) => formatMoeda(parseFloat(mov.saldo)) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Razao (Ledger)" description="Movimentacoes de uma conta no periodo" />

      <FilterBar>
        <div className="space-y-1 flex-1 max-w-sm">
          <Label className="text-xs">Conta</Label>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Selecione uma conta...</option>
            {accounts?.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.codigo} - {acc.nome}
              </option>
            ))}
          </Select>
        </div>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
        <Button onClick={handleConsultar} disabled={!accountId}>
          Consultar
        </Button>
      </FilterBar>

      {query.accountId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {ledger?.account
                ? `${ledger.account.codigo} - ${ledger.account.nome} (${ledger.account.natureza})`
                : 'Carregando...'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : ledger?.movements?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentacao no periodo
              </div>
            ) : (
              <DataTable
                columns={ledgerColumns}
                data={ledger?.movements || []}
                keyExtractor={(mov: any) => `${mov.date}-${mov.numero}`}
                footer={
                  <>
                    <td colSpan={4} className="px-4 py-2.5 text-right">Saldo Final:</td>
                    <td className="px-4 py-2.5 text-right font-mono" />
                    <td className="px-4 py-2.5 text-right font-mono">
                      {ledger?.saldoFinal ? formatMoeda(parseFloat(ledger.saldoFinal)) : '—'}
                    </td>
                  </>
                }
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function LedgerPage() {
  return <CompanyRequired>{(companyId) => <LedgerContent companyId={companyId} />}</CompanyRequired>;
}
