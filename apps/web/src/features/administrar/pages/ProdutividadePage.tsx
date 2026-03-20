import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { PageHeader } from '@/components/molecules/page-header';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { YearMonthFilter } from '@/components/molecules/year-month-filter';
import { FilterBar } from '@/components/organisms/filter-bar';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { useProductivity } from '../hooks/useAdministrar';
import type { ProdutividadeItem } from '../services/administrar.service';

export function ProdutividadePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: productivity, isLoading } = useProductivity(year, month);

  const columns: Column<ProdutividadeItem>[] = [
    {
      key: 'userName',
      header: 'Usuario',
      render: (item) => <span className="font-medium">{item.userName || item.userId}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      className: 'w-20 text-center',
      render: (item) => <span className="font-mono">{item.total}</span>,
    },
    {
      key: 'concluidas',
      header: 'Concluidas',
      className: 'w-24 text-center',
      render: (item) => <span className="font-mono text-green-600">{item.concluidas}</span>,
    },
    {
      key: 'pendentes',
      header: 'Pendentes',
      className: 'w-24 text-center',
      render: (item) => <span className="font-mono text-amber-600">{item.pendentes}</span>,
    },
    {
      key: 'taxa',
      header: '% Conclusao',
      className: 'w-28 text-center',
      hideOnMobile: true,
      render: (item) => (
        <span className="font-mono">
          {item.total > 0 ? Math.round((item.concluidas / item.total) * 100) : 0}%
        </span>
      ),
    },
  ];

  const renderMobileCard = (item: ProdutividadeItem) => (
    <ListItemCard
      title={<span className="font-medium">{item.userName || item.userId}</span>}
      subtitle={
        <>
          <span>Total: {item.total}</span>
          <span className="text-green-600">Concluidas: {item.concluidas}</span>
          <span className="text-amber-600">Pendentes: {item.pendentes}</span>
          <span>
            Taxa: {item.total > 0 ? Math.round((item.concluidas / item.total) * 100) : 0}%
          </span>
        </>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtividade"
        description="Acompanhamento de produtividade da equipe"
      />

      <FilterBar>
        <YearMonthFilter
          year={year}
          month={month}
          onYearChange={setYear}
          onMonthChange={setMonth}
        />
      </FilterBar>

      {isLoading ? (
        <LoadingState />
      ) : !productivity || productivity.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sem dados de produtividade"
          description="Nenhuma tarefa encontrada para o periodo selecionado"
        />
      ) : (
        <DataTable
          columns={columns}
          data={productivity}
          keyExtractor={(item: ProdutividadeItem) => item.userId}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}
