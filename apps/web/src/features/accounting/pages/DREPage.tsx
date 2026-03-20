import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

export function DREPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const [startDate, setStartDate] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [query, setQuery] = useState({ start: startDate, end: endDate });

  const { data, isLoading } = useQuery({
    queryKey: ['dre', companyId, query.start, query.end],
    queryFn: () => api.get(`/companies/${companyId}/reports/dre`, { params: { startDate: query.start, endDate: query.end } }).then((r) => r.data),
    enabled: !!companyId,
  });

  if (!companyId) return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;

  const renderLine = (label: string, value: string, bold = false, indent = false) => (
    <div className={`flex justify-between py-1.5 ${bold ? 'font-semibold border-t' : ''} ${indent ? 'pl-4' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className={`font-mono text-sm ${parseFloat(value) < 0 ? 'text-red-600' : ''}`}>
        {formatMoeda(parseFloat(value))}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">DRE - Demonstracao do Resultado</h1></div>
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">De</label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ate</label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={() => setQuery({ start: startDate, end: endDate })}>Gerar</Button>
      </div>

      {isLoading ? <div className="text-muted-foreground">Carregando...</div> : data && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">
              Periodo: {dayjs(query.start).format('DD/MM/YYYY')} a {dayjs(query.end).format('DD/MM/YYYY')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {renderLine('RECEITA BRUTA', data.receitas?.total || '0', true)}
            {data.receitas?.accounts?.map((a: any) => renderLine(a.nome, a.saldo, false, true))}

            {renderLine('(-) CUSTOS', '-' + (data.custos?.total || '0'), true)}
            {data.custos?.accounts?.map((a: any) => renderLine(a.nome, '-' + a.saldo, false, true))}

            {renderLine('= LUCRO BRUTO', data.lucroBruto, true)}

            {renderLine('(-) DESPESAS OPERACIONAIS', '-' + (data.despesas?.total || '0'), true)}
            {data.despesas?.accounts?.map((a: any) => renderLine(a.nome, '-' + a.saldo, false, true))}

            <div className="border-t-2 border-black mt-2 pt-2">
              {renderLine('= RESULTADO LIQUIDO', data.resultadoLiquido, true)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
