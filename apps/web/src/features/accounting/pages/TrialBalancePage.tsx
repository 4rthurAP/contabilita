import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrialBalance } from '../hooks/useAccounting';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

const TIPO_LABELS: Record<string, string> = {
  ativo: 'Ativo',
  passivo: 'Passivo',
  patrimonio_liquido: 'PL',
  receita: 'Receita',
  despesa: 'Despesa',
};

export function TrialBalancePage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [queryDates, setQueryDates] = useState({ start: startDate, end: endDate });

  const { data, isLoading } = useTrialBalance(companyId, queryDates.start, queryDates.end);

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Balancete de Verificacao</h1>
        <p className="text-muted-foreground">Saldos de todas as contas no periodo</p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ate</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={() => setQueryDates({ start: startDate, end: endDate })}>
          Consultar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Periodo: {dayjs(queryDates.start).format('DD/MM/YYYY')} a{' '}
            {dayjs(queryDates.end).format('DD/MM/YYYY')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">Carregando...</div>
          ) : data?.accounts?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum lancamento no periodo
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                <div className="col-span-1">Codigo</div>
                <div className="col-span-4">Conta</div>
                <div className="col-span-1">Tipo</div>
                <div className="col-span-2 text-right">Debitos</div>
                <div className="col-span-2 text-right">Creditos</div>
                <div className="col-span-2 text-right">Saldo</div>
              </div>

              {data?.accounts?.map((acc) => {
                const debit = parseFloat(acc.totalDebit);
                const credit = parseFloat(acc.totalCredit);
                const saldo = parseFloat(acc.saldo);
                return (
                  <div
                    key={acc.accountId}
                    className="grid grid-cols-12 gap-2 px-4 py-2 border-t text-sm"
                  >
                    <div className="col-span-1 font-mono text-xs text-muted-foreground">
                      {acc.codigo}
                    </div>
                    <div className="col-span-4">{acc.nome}</div>
                    <div className="col-span-1 text-xs text-muted-foreground">
                      {TIPO_LABELS[acc.tipo] || acc.tipo}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {formatMoeda(debit)}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {formatMoeda(credit)}
                    </div>
                    <div
                      className={`col-span-2 text-right font-mono ${
                        acc.saldoNatureza === 'invertido' ? 'text-destructive' : ''
                      }`}
                    >
                      {formatMoeda(Math.abs(saldo))}
                      {acc.saldoNatureza === 'invertido' && ' (inv)'}
                    </div>
                  </div>
                );
              })}

              {/* Totais */}
              {data?.totals && (
                <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-2 border-t font-semibold text-sm">
                  <div className="col-span-6 text-right">TOTAIS</div>
                  <div className="col-span-2 text-right font-mono">
                    {formatMoeda(parseFloat(data.totals.totalDebit))}
                  </div>
                  <div className="col-span-2 text-right font-mono">
                    {formatMoeda(parseFloat(data.totals.totalCredit))}
                  </div>
                  <div className="col-span-2 text-right">
                    {data.totals.balanced ? (
                      <span className="text-green-600 text-xs">Balanceado</span>
                    ) : (
                      <span className="text-destructive text-xs">Desbalanceado!</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
