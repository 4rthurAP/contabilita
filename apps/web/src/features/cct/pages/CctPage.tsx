import { useState } from 'react';
import { Calculator, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/molecules/page-header';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
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

  const columns: Column<RegimeComparison>[] = [
    { key: 'regime', header: 'Regime', render: (r) => <span className="font-medium">{r.regime}</span> },
    { key: 'impostoTotal', header: 'Imposto Total', className: 'text-right font-mono', render: (r) => formatMoeda(r.impostoTotal) },
    { key: 'aliquotaEfetiva', header: 'Aliquota Efetiva', className: 'text-right font-mono', render: (r) => `${(r.aliquotaEfetiva * 100).toFixed(2)}%` },
  ];

  const renderMobileCard = (r: RegimeComparison) => (
    <ListItemCard
      title={<span className="font-medium">{r.regime}</span>}
      subtitle={
        <>
          <span>Imposto: {formatMoeda(r.impostoTotal)}</span>
          <span>Aliquota: {(r.aliquotaEfetiva * 100).toFixed(2)}%</span>
        </>
      }
    />
  );

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
          <div className="flex-1 space-y-1">
            <Label>Receita Anual (R$)</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={receitaAnual}
              onChange={(e) => setReceitaAnual(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Despesas Anuais (R$)</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={despesasAnuais}
              onChange={(e) => setDespesasAnuais(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={compareRegimes.isPending}>
              Comparar
            </Button>
          </div>
        </form>

        {results && results.length > 0 && (
          <DataTable
            columns={columns}
            data={results}
            keyExtractor={(r) => r.regime}
            mobileCard={renderMobileCard}
          />
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
          <div className="flex-1 space-y-1">
            <Label>CNAE</Label>
            <Input
              placeholder="Ex: 6920-6/01"
              value={cnae}
              onChange={(e) => setCnae(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label>Receita Bruta 12 meses (R$)</Label>
            <Input
              type="number"
              placeholder="0,00"
              value={receita12m}
              onChange={(e) => setReceita12m(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={simplesRates.isPending}>
              Consultar
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

  const columns: Column<PisCofinsResult>[] = [
    { key: 'ncm', header: 'NCM', className: 'font-mono', render: (r) => r.ncm },
    { key: 'cst', header: 'CST', render: (r) => r.cst },
    { key: 'pis', header: 'PIS (%)', className: 'text-right font-mono', render: (r) => `${(r.pisAliquota * 100).toFixed(2)}%` },
    { key: 'cofins', header: 'COFINS (%)', className: 'text-right font-mono', render: (r) => `${(r.cofinsAliquota * 100).toFixed(2)}%` },
    { key: 'natureza', header: 'Natureza', className: 'text-xs', hideOnMobile: true, render: (r) => r.natureza || '\u2014' },
  ];

  const renderMobileCard = (r: PisCofinsResult) => (
    <ListItemCard
      title={<span className="font-mono">{r.ncm}</span>}
      subtitle={
        <>
          <span>CST: {r.cst}</span>
          <span>PIS: {(r.pisAliquota * 100).toFixed(2)}%</span>
          <span>COFINS: {(r.cofinsAliquota * 100).toFixed(2)}%</span>
        </>
      }
    />
  );

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
          <div className="flex-1 space-y-1">
            <Label>NCM</Label>
            <Input
              placeholder="Ex: 8471.30.19"
              value={ncm}
              onChange={(e) => setNcm(e.target.value)}
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={pisCofins.isPending}>
              Buscar
            </Button>
          </div>
        </form>

        {results.length > 0 && (
          <DataTable
            columns={columns}
            data={results}
            keyExtractor={(r) => `${r.ncm}-${r.cst}`}
            mobileCard={renderMobileCard}
          />
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
