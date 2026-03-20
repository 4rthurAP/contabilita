import { useState } from 'react';
import { Send, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { StatCard } from '@/components/molecules/stat-card';
import { YearMonthFilter } from '@/components/molecules/year-month-filter';
import { FilterBar } from '@/components/organisms/filter-bar';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { OBLIGATION_STATUS_MAP } from '@/lib/constants';
import {
  useObligations,
  useGenerateMonthly,
  useGenerateAnnual,
  useGenerateSpedEcd,
  useGenerateSpedEfd,
} from '../hooks/useObligations';
import dayjs from 'dayjs';

function ObligationsContent({ companyId }: { companyId: string }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: obligations, isLoading } = useObligations(companyId, year);
  const genMonthly = useGenerateMonthly(companyId);
  const genAnnual = useGenerateAnnual(companyId);
  const genEcd = useGenerateSpedEcd(companyId);
  const genEfd = useGenerateSpedEfd(companyId);

  const pendingCount = obligations?.filter((o: any) => o.status === 'pendente').length || 0;
  const overdueCount = obligations?.filter((o: any) =>
    o.status === 'pendente' && new Date(o.prazoEntrega) < new Date()
  ).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Obrigacoes Acessorias" description="SPED, DCTFWeb, EFD-Reinf e demais obrigacoes" />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard title="Total de obrigacoes" value={obligations?.length || 0} />
        <StatCard title="Pendentes" value={pendingCount} valueClassName="text-warning" />
        <StatCard title="Vencidas" value={overdueCount} valueClassName="text-destructive" />
      </div>

      <FilterBar>
        <YearMonthFilter year={year} month={month} onYearChange={setYear} onMonthChange={setMonth} />
        <Button variant="outline" size="sm" onClick={() => genMonthly.mutate({ year, month })} disabled={genMonthly.isPending}>
          Gerar Mensais
        </Button>
        <Button variant="outline" size="sm" onClick={() => genAnnual.mutate(year)} disabled={genAnnual.isPending}>
          Gerar Anuais
        </Button>
        <Button size="sm" onClick={() => genEcd.mutate(year)} disabled={genEcd.isPending}>
          {genEcd.isPending ? 'Gerando...' : 'Gerar SPED ECD'}
        </Button>
        <Button size="sm" onClick={() => genEfd.mutate({ year, month })} disabled={genEfd.isPending}>
          {genEfd.isPending ? 'Gerando...' : 'Gerar SPED EFD'}
        </Button>
      </FilterBar>

      {isLoading ? (
        <LoadingState />
      ) : !obligations || obligations.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Nenhuma obrigacao cadastrada"
          description="Gere as obrigacoes mensais ou anuais"
        />
      ) : (
        <div className="space-y-2">
          {obligations.map((obl: any) => {
            const isOverdue = obl.status === 'pendente' && new Date(obl.prazoEntrega) < new Date();

            return (
              <ListItemCard
                key={obl._id}
                className={isOverdue ? 'border-destructive/50' : ''}
                title={
                  <>
                    <span className="font-mono font-bold">{obl.tipo}</span>
                    <span className="text-muted-foreground">{obl.competencia}</span>
                    <StatusBadge status={obl.status} statusMap={OBLIGATION_STATUS_MAP} />
                    {isOverdue && <Badge variant="danger">VENCIDA</Badge>}
                  </>
                }
                actions={
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Prazo: {dayjs(obl.prazoEntrega).format('DD/MM/YYYY')}
                    </span>
                    {obl.fileName && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/companies/${companyId}/obligations/${obl._id}/download`)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        {obl.fileName}
                      </Button>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ObligationsPage() {
  return <CompanyRequired>{(companyId) => <ObligationsContent companyId={companyId} />}</CompanyRequired>;
}
