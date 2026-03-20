import { useState } from 'react';
import { Calculator, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/molecules/page-header';
import { useCompareRegimes, useSimplesRates, usePisCofins } from '../hooks/useCct';
import { formatMoeda } from '@/utils/formatters';
import type { RegimeComparison, SimplesRatesResult, PisCofinsResult } from '../services/cct.service';

function CompararRegimesSection() {
  const [receitaAnual, setReceitaAnual] = useState('');
  const [despesasAnuais, setDespesasAnuais] = useState('');
  const compareRegimes = useCompareRegimes();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    compareRegimes.mutate({
      receitaAnual: parseFloat(receitaAnual),
      despesasAnuais: parseFloat(despesasAnuais),
    });
  };

  const results = compareRegimes.data as RegimeComparison[] | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Comparar Regimes Tributarios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Receita Anual (R$)</label>
            <Input
              type="number"
              placeholder="0,00"
              value={receitaAnual}
              onChange={(e) => setReceitaAnual(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Despesas Anuais (R$)</label>
            <Input
              type="number"
              placeholder="0,00"
              value={despesasAnuais}
              onChange={(e) => setDespesasAnuais(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={compareRegimes.isPending}>
              {compareRegimes.isPending ? 'Calculando...' : 'Comparar'}
            </Button>
          </div>
        </form>

        {results && results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">Regime</th>
                  <th className="text-right py-2 px-3 font-medium">Imposto Total</th>
                  <th className="text-right py-2 px-3 font-medium">Aliquota Efetiva</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.regime} className="border-b last:border-0">
                    <td className="py-2 px-3 font-medium">{r.regime}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatMoeda(r.impostoTotal)}</td>
                    <td className="py-2 px-3 text-right font-mono">{(r.aliquotaEfetiva * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {results.map((r) => (
              <Card key={r.regime}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{r.regime}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-xs">
                    {r.detalhes?.map((d) => (
                      <div key={d.imposto} className="flex justify-between">
                        <span className="text-muted-foreground">{d.imposto}</span>
                        <span className="font-mono">{formatMoeda(d.valor)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SimplesNacionalSection() {
  const [cnae, setCnae] = useState('');
  const [receita12m, setReceita12m] = useState('');
  const simplesRates = useSimplesRates();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simplesRates.mutate({
      cnae,
      receita12m: parseFloat(receita12m),
    });
  };

  const result = simplesRates.data as SimplesRatesResult | undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Simples Nacional - Consulta de Aliquotas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">CNAE</label>
            <Input
              placeholder="Ex: 6920-6/01"
              value={cnae}
              onChange={(e) => setCnae(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">Receita Bruta 12 meses (R$)</label>
            <Input
              type="number"
              placeholder="0,00"
              value={receita12m}
              onChange={(e) => setReceita12m(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={simplesRates.isPending}>
              {simplesRates.isPending ? 'Consultando...' : 'Consultar'}
            </Button>
          </div>
        </form>

        {result && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Anexo</div>
              <div className="text-lg font-bold">{result.anexo}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Faixa</div>
              <div className="text-lg font-bold">{result.faixa}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Aliquota Nominal</div>
              <div className="text-lg font-bold font-mono">{(result.aliquotaNominal * 100).toFixed(2)}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Aliquota Efetiva</div>
              <div className="text-lg font-bold font-mono text-primary">{(result.aliquotaEfetiva * 100).toFixed(2)}%</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PisCofinsSection() {
  const [ncm, setNcm] = useState('');
  const pisCofins = usePisCofins();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pisCofins.mutate({ ncm });
  };

  const result = pisCofins.data as PisCofinsResult | PisCofinsResult[] | undefined;
  const results = Array.isArray(result) ? result : result ? [result] : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          PIS/COFINS - Consulta por NCM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-muted-foreground">NCM</label>
            <Input
              placeholder="Ex: 8471.30.19"
              value={ncm}
              onChange={(e) => setNcm(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pisCofins.isPending}>
              {pisCofins.isPending ? 'Buscando...' : 'Buscar'}
            </Button>
          </div>
        </form>

        {results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">NCM</th>
                  <th className="text-left py-2 px-3 font-medium">CST</th>
                  <th className="text-right py-2 px-3 font-medium">PIS (%)</th>
                  <th className="text-right py-2 px-3 font-medium">COFINS (%)</th>
                  <th className="text-left py-2 px-3 font-medium">Natureza</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-3 font-mono">{r.ncm}</td>
                    <td className="py-2 px-3">{r.cst}</td>
                    <td className="py-2 px-3 text-right font-mono">{(r.pisAliquota * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-right font-mono">{(r.cofinsAliquota * 100).toFixed(2)}%</td>
                    <td className="py-2 px-3 text-xs">{r.natureza || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CctPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultoria e Compliance Tributario"
        description="Ferramentas de analise e consulta tributaria"
      />
      <CompararRegimesSection />
      <SimplesNacionalSection />
      <PisCofinsSection />
    </div>
  );
}
