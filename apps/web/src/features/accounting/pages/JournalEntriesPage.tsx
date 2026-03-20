import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useJournalEntries } from '../hooks/useAccounting';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

export function JournalEntriesPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  const { data, isLoading } = useJournalEntries(companyId, page, startDate, endDate);

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lancamentos Contabeis</h1>
          <p className="text-muted-foreground">Registro de lancamentos com partida dobrada</p>
        </div>
        <Link to={`/accounting/journal-entries/new?companyId=${companyId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lancamento
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ate</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : data?.data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum lancamento no periodo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((entry: any) => (
            <Card key={entry._id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">#{entry.numero}</span>
                      <span>{entry.description}</span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground">
                      {dayjs(entry.date).format('DD/MM/YYYY')} | {entry.tipo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatMoeda(parseFloat(entry.totalDebit?.$numberDecimal || entry.totalDebit || '0'))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="rounded border text-xs">
                  {entry.lines?.map((line: any, i: number) => {
                    const acc = line.accountId;
                    const debit = parseFloat(line.debit?.$numberDecimal || line.debit || '0');
                    const credit = parseFloat(line.credit?.$numberDecimal || line.credit || '0');
                    return (
                      <div key={i} className="flex items-center gap-4 px-3 py-1.5 border-b last:border-0">
                        <span className="font-mono text-muted-foreground w-24">
                          {acc?.codigo || '—'}
                        </span>
                        <span className="flex-1">{acc?.nome || line.historico}</span>
                        <span className={debit > 0 ? 'text-blue-600 w-24 text-right' : 'w-24 text-right text-muted-foreground'}>
                          {debit > 0 ? formatMoeda(debit) : '—'}
                        </span>
                        <span className={credit > 0 ? 'text-red-600 w-24 text-right' : 'w-24 text-right text-muted-foreground'}>
                          {credit > 0 ? formatMoeda(credit) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page} de {data.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Proxima
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
