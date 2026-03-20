import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

export function BalancoPatrimonialPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [queryDate, setQueryDate] = useState(endDate);

  const { data, isLoading } = useQuery({
    queryKey: ['balanco', companyId, queryDate],
    queryFn: () => api.get(`/companies/${companyId}/reports/balanco-patrimonial`, { params: { endDate: queryDate } }).then((r) => r.data),
    enabled: !!companyId && !!queryDate,
  });

  if (!companyId) return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;

  const renderSection = (title: string, section: any, color: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={`text-base ${color}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {section?.accounts?.map((acc: any) => (
          <div key={acc.accountId} className="flex justify-between py-1 text-sm border-b last:border-0">
            <span><span className="text-xs font-mono text-muted-foreground mr-2">{acc.codigo}</span>{acc.nome}</span>
            <span className="font-mono">{formatMoeda(parseFloat(acc.saldo))}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 font-semibold text-sm border-t mt-2">
          <span>Total {title}</span>
          <span className="font-mono">{formatMoeda(parseFloat(section?.total || '0'))}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Balanco Patrimonial</h1></div>
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Data base</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={() => setQueryDate(endDate)}>Gerar</Button>
      </div>

      {isLoading ? <div className="text-muted-foreground">Carregando...</div> : data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {renderSection('Ativo', data.ativo, 'text-blue-700')}
          </div>
          <div className="space-y-4">
            {renderSection('Passivo', data.passivo, 'text-red-700')}
            {renderSection('Patrimonio Liquido', data.patrimonioLiquido, 'text-green-700')}
            <div className="text-center text-sm">
              {data.balanced ? (
                <span className="text-green-600 font-medium">Ativo = Passivo + PL (Balanceado)</span>
              ) : (
                <span className="text-red-600 font-medium">Desbalanceado!</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
