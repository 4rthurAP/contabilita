import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { useCalculateLucroReal } from '../hooks/useLalur';
import { formatMoeda } from '@/utils/formatters';
import type { LucroRealResult } from '../services/lalur.service';

function LalurCalcContent({ companyId }: { companyId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState(1);
  const [lucroContabil, setLucroContabil] = useState('');
  const [result, setResult] = useState<LucroRealResult | null>(null);

  const calculate = useCalculateLucroReal(companyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculate.mutate(
      { year, quarter, lucroContabil },
      { onSuccess: (data) => setResult(data) },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calculo do Lucro Real"
        description="Apuracao do IRPJ/CSLL com base no LALUR"
        breadcrumbs={[{ label: 'LALUR', href: '/app/lalur' }, { label: 'Calculo Lucro Real' }]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parametros de Calculo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Ano</label>
              <Input
                type="number"
                className="w-24"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Trimestre</label>
              <Select
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value))}
                className="w-auto"
              >
                <option value={1}>1o Trimestre</option>
                <option value={2}>2o Trimestre</option>
                <option value={3}>3o Trimestre</option>
                <option value={4}>4o Trimestre</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Lucro Contabil (R$)</label>
              <Input
                type="text"
                className="w-40"
                placeholder="0,00"
                value={lucroContabil}
                onChange={(e) => setLucroContabil(e.target.value)}
              />
            </div>
            <Button type="submit" loading={calculate.isPending} disabled={!lucroContabil}>
              <Calculator className="mr-2 h-4 w-4" />
              Calcular
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Resultado - {year} / {quarter}o Trimestre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <ResultItem label="Lucro Contabil" value={result.lucroContabil} />
              <ResultItem label="(+) Adicoes" value={result.totalAdicoes} className="text-destructive" />
              <ResultItem label="(-) Exclusoes" value={result.totalExclusoes} className="text-success" />
              <ResultItem label="(-) Compensacao Prejuizos" value={result.compensacaoPrejuizos} className="text-warning" />
              <ResultItem label="Lucro Real" value={result.lucroReal} className="text-primary font-bold" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Base de calculo apurada com {result.entries} lancamento(s) no LALUR.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResultItem({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-mono ${className}`}>{formatMoeda(value)}</div>
    </div>
  );
}

export function LalurCalcPage() {
  return (
    <CompanyRequired>{(companyId) => <LalurCalcContent companyId={companyId} />}</CompanyRequired>
  );
}
