import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { DateRangeFilter } from '@/components/molecules/date-range-filter';
import { Pagination } from '@/components/molecules/pagination';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { useJournalEntries } from '../hooks/useAccounting';
import { formatMoeda, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function JournalEntriesContent({ companyId }: { companyId: string }) {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  const { data, isLoading } = useJournalEntries(companyId, page, startDate, endDate);

  const columns: Column<any>[] = [
    { key: 'numero', header: 'No', className: 'w-16', render: (e) => <span className="font-mono text-xs text-muted-foreground">#{e.numero}</span> },
    { key: 'date', header: 'Data', className: 'w-24', render: (e) => dayjs(e.date).format('DD/MM/YYYY') },
    { key: 'description', header: 'Descricao', render: (e) => e.description },
    { key: 'tipo', header: 'Tipo', className: 'w-20', hideOnMobile: true, render: (e) => <span className="text-xs text-muted-foreground">{e.tipo}</span> },
    { key: 'total', header: 'Total', className: 'text-right font-mono', render: (e) => formatMoeda(d128(e.totalDebit)) },
  ];

  const renderMobileCard = (entry: any) => (
    <ListItemCard
      title={
        <>
          <span className="font-mono text-muted-foreground">#{entry.numero}</span>
          <span>{entry.description}</span>
        </>
      }
      subtitle={
        <>
          <span>{dayjs(entry.date).format('DD/MM/YYYY')}</span>
          <span>{entry.tipo}</span>
        </>
      }
      actions={<div className="text-sm font-medium">{formatMoeda(d128(entry.totalDebit))}</div>}
    >
      <div className="overflow-x-auto rounded border text-xs">
        {entry.lines?.map((line: any, i: number) => {
          const acc = line.accountId;
          const debit = d128(line.debit);
          const credit = d128(line.credit);
          return (
            <div key={i} className="flex items-center gap-4 px-3 py-1.5 border-b last:border-0">
              <span className="font-mono text-muted-foreground w-24">{acc?.codigo || '—'}</span>
              <span className="flex-1">{acc?.nome || line.historico}</span>
              <span className={debit > 0 ? 'text-debit w-24 text-right' : 'w-24 text-right text-muted-foreground'}>
                {debit > 0 ? formatMoeda(debit) : '—'}
              </span>
              <span className={credit > 0 ? 'text-credit w-24 text-right' : 'w-24 text-right text-muted-foreground'}>
                {credit > 0 ? formatMoeda(credit) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </ListItemCard>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lancamentos Contabeis"
        description="Registro de lancamentos com partida dobrada"
        actions={
          <Link to={`/accounting/journal-entries/new?companyId=${companyId}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lancamento
            </Button>
          </Link>
        }
      />

      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {isLoading ? (
        <LoadingState />
      ) : data?.data?.length === 0 ? (
        <EmptyState icon={FileText} title="Nenhum lancamento no periodo" />
      ) : (
        <div className="space-y-3">
          <DataTable
            columns={columns}
            data={data?.data || []}
            keyExtractor={(e: any) => e._id}
            mobileCard={renderMobileCard}
          />

          <Pagination page={page} totalPages={data?.totalPages || 1} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

export function JournalEntriesPage() {
  return <CompanyRequired>{(companyId) => <JournalEntriesContent companyId={companyId} />}</CompanyRequired>;
}
