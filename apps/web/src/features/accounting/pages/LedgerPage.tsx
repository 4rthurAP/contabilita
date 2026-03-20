import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticalAccounts, useLedger } from '../hooks/useAccounting';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

export function LedgerPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));
  const [query, setQuery] = useState({ accountId: '', start: '', end: '' });

  const { data: accounts } = useAnalyticalAccounts(companyId);
  const { data: ledger, isLoading } = useLedger(
    companyId,
    query.accountId,
    query.start,
    query.end,
  );

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  const handleConsultar = () => {
    if (accountId && startDate && endDate) {
      setQuery({ accountId, start: startDate, end: endDate });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Razao (Ledger)</h1>
        <p className="text-muted-foreground">Movimentacoes de uma conta no periodo</p>
      </div>

      <div className="flex items-end gap-4">
        <div className="space-y-1 flex-1 max-w-sm">
          <label className="text-xs text-muted-foreground">Conta</label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Selecione uma conta...</option>
            {accounts?.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.codigo} - {acc.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ate</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={handleConsultar} disabled={!accountId}>
          Consultar
        </Button>
      </div>

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
              <div className="text-muted-foreground py-8 text-center">Carregando...</div>
            ) : ledger?.movements?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentacao no periodo
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
                  <div className="col-span-1">Data</div>
                  <div className="col-span-1">No</div>
                  <div className="col-span-4">Historico</div>
                  <div className="col-span-2 text-right">Debito</div>
                  <div className="col-span-2 text-right">Credito</div>
                  <div className="col-span-2 text-right">Saldo</div>
                </div>

                {ledger?.movements?.map((mov, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2 border-t text-sm">
                    <div className="col-span-1 text-xs">{dayjs(mov.date).format('DD/MM')}</div>
                    <div className="col-span-1 font-mono text-xs text-muted-foreground">
                      #{mov.numero}
                    </div>
                    <div className="col-span-4 text-xs">{mov.historico}</div>
                    <div className="col-span-2 text-right font-mono">
                      {parseFloat(mov.debit) > 0 ? formatMoeda(parseFloat(mov.debit)) : '—'}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {parseFloat(mov.credit) > 0 ? formatMoeda(parseFloat(mov.credit)) : '—'}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {formatMoeda(parseFloat(mov.saldo))}
                    </div>
                  </div>
                ))}

                <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-2 border-t font-semibold text-sm">
                  <div className="col-span-10 text-right">Saldo Final:</div>
                  <div className="col-span-2 text-right font-mono">
                    {ledger?.saldoFinal ? formatMoeda(parseFloat(ledger.saldoFinal)) : '—'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
