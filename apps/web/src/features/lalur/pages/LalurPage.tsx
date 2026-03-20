import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { FilterBar } from '@/components/organisms/filter-bar';
import { useLalurEntries, useLalurBalances } from '../hooks/useLalur';
import { formatMoeda, d128 } from '@/utils/formatters';

type Tab = 'parte-a' | 'parte-b';

const QUARTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1', label: '1o Trimestre' },
  { value: '2', label: '2o Trimestre' },
  { value: '3', label: '3o Trimestre' },
  { value: '4', label: '4o Trimestre' },
];

function LalurContent({ companyId }: { companyId: string }) {
  const now = new Date();
  const [tab, setTab] = useState<Tab>('parte-a');
  const [year, setYear] = useState(now.getFullYear());
  const [quarter, setQuarter] = useState('');

  const { data: entries, isLoading: loadingEntries } = useLalurEntries(
    companyId,
    year,
    quarter ? Number(quarter) : undefined,
  );
  const { data: balances, isLoading: loadingBalances } = useLalurBalances(companyId, year);

  const entryColumns: Column<any>[] = [
    { key: 'tipo', header: 'Tipo', className: 'w-28', render: (e) => <span className="font-mono font-bold">{e.tipo}</span> },
    { key: 'descricao', header: 'Descricao', render: (e) => e.descricao },
    { key: 'valor', header: 'Valor', className: 'text-right font-mono', render: (e) => formatMoeda(d128(e.valor)) },
    { key: 'quarter', header: 'Trimestre', className: 'w-24', render: (e) => `${e.quarter}o` },
  ];

  const balanceColumns: Column<any>[] = [
    { key: 'tipo', header: 'Tipo', className: 'w-28', render: (b) => <span className="font-mono font-bold">{b.tipo}</span> },
    { key: 'descricao', header: 'Descricao', render: (b) => b.descricao },
    { key: 'saldoInicial', header: 'Saldo Inicial', className: 'text-right font-mono', render: (b) => formatMoeda(d128(b.saldoInicial)) },
    { key: 'saldoFinal', header: 'Saldo Final', className: 'text-right font-mono', render: (b) => formatMoeda(d128(b.saldoFinal)) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="LALUR - Livro de Apuracao do Lucro Real"
        description="Parte A (adicoes e exclusoes) e Parte B (controle de saldos)"
      />

      <div className="flex gap-2">
        <Button
          variant={tab === 'parte-a' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('parte-a')}
        >
          Parte A - Lancamentos
        </Button>
        <Button
          variant={tab === 'parte-b' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTab('parte-b')}
        >
          Parte B - Saldos
        </Button>
      </div>

      <FilterBar>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Ano:</label>
          <Input
            type="number"
            className="w-24"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        {tab === 'parte-a' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Trimestre:</label>
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
            >
              {QUARTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </FilterBar>

      {tab === 'parte-a' ? (
        loadingEntries ? (
          <LoadingState />
        ) : !entries || entries.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhum lancamento encontrado"
            description="Nenhum lancamento de LALUR Parte A para o periodo selecionado"
          />
        ) : (
          <DataTable
            columns={entryColumns}
            data={entries}
            keyExtractor={(e: any) => e._id}
          />
        )
      ) : loadingBalances ? (
        <LoadingState />
      ) : !balances || balances.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nenhum saldo encontrado"
          description="Nenhum saldo de LALUR Parte B para o ano selecionado"
        />
      ) : (
        <DataTable
          columns={balanceColumns}
          data={balances}
          keyExtractor={(b: any) => b._id}
        />
      )}
    </div>
  );
}

export function LalurPage() {
  return <CompanyRequired>{(companyId) => <LalurContent companyId={companyId} />}</CompanyRequired>;
}
