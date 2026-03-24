import { useState } from 'react';
import { PageHeader } from '@/components/molecules/page-header';
import { StatCard } from '@/components/molecules/stat-card';
import { CompanySelector } from '@/components/molecules/company-selector';
import { DreTrendChart } from '@/components/organisms/charts/dre-trend-chart';
import { TaxBurdenChart } from '@/components/organisms/charts/tax-burden-chart';
import { WelcomeCard } from '../components/WelcomeCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useDashboardSummary,
  useRecentActivity,
  useDreTrend,
  useTaxBurden,
} from '../hooks/useDashboard';
import { useCompanies } from '@/features/companies/hooks/useCompanies';
import { useUiStore } from '@/stores/ui.store';
import {
  Building2,
  FileText,
  Users,
  Landmark,
  AlertTriangle,
  ArrowDownUp,
  Clock,
} from 'lucide-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pt-br';

dayjs.extend(relativeTime);
dayjs.locale('pt-br');

function formatCurrency(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parseFloat(value));
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Removeu',
  login: 'Login',
  logout: 'Logout',
  action: 'Acao',
};

export function DashboardPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>();
  const { onboardingDismissed, dismissOnboarding } = useUiStore();
  const { data: companiesData } = useCompanies(1);
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary(selectedCompanyId);
  const { data: activity } = useRecentActivity(selectedCompanyId);
  const { data: dreTrend, isLoading: loadingDre } = useDreTrend(selectedCompanyId);
  const { data: taxBurden, isLoading: loadingTax } = useTaxBurden(selectedCompanyId);

  const companies = companiesData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Dashboard" description="Visao geral do escritorio contabil" />
        {companies.length > 1 && (
          <CompanySelector
            companies={companies}
            selectedId={selectedCompanyId}
            onSelect={setSelectedCompanyId}
            placeholder="Todas as empresas"
            className="w-full sm:w-72"
          />
        )}
      </div>

      {/* Onboarding */}
      {!onboardingDismissed && <WelcomeCard onDismiss={dismissOnboarding} />}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: 'Empresas Ativas',
            value: summary?.companiesCount ?? 0,
            subtitle: companies.length > 0 ? `${companies.length} cadastradas` : 'Cadastre a primeira',
            icon: Building2,
          },
          {
            title: 'Lancamentos do Mes',
            value: summary?.entriesThisMonth ?? 0,
            subtitle: 'Lancamentos contabeis',
            icon: FileText,
          },
          {
            title: 'Funcionarios Ativos',
            value: summary?.employeesCount ?? 0,
            subtitle: 'Na folha de pagamento',
            icon: Users,
          },
          {
            title: 'Guias Pendentes',
            value: formatCurrency(summary?.pendingPaymentsTotal ?? '0'),
            subtitle: summary?.overduePayments ? `${summary.overduePayments} vencida(s)` : 'Nenhuma vencida',
            icon: Landmark,
            valueClassName: summary?.overduePayments ? 'text-destructive' : undefined,
          },
        ].map((card, i) => (
          <div key={card.title} className="motion-safe:animate-fade-in" style={{ animationDelay: `${i * 75}ms`, animationFillMode: 'backwards' }}>
            <StatCard {...card} isLoading={loadingSummary} />
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: 'Conciliacao Pendente',
            value: summary?.pendingReconciliation ?? 0,
            subtitle: 'Transacoes bancarias',
            icon: ArrowDownUp,
          },
          {
            title: 'Obrigacoes Proximas',
            value: summary?.upcomingObligations ?? 0,
            subtitle: 'Nos proximos 30 dias',
            icon: Clock,
          },
          {
            title: 'Guias Vencidas',
            value: summary?.overduePayments ?? 0,
            subtitle: 'Requerem atencao imediata',
            icon: AlertTriangle,
            valueClassName: summary?.overduePayments ? 'text-destructive' : undefined,
          },
        ].map((card, i) => (
          <div key={card.title} className="motion-safe:animate-fade-in" style={{ animationDelay: `${(i + 4) * 75}ms`, animationFillMode: 'backwards' }}>
            <StatCard {...card} isLoading={loadingSummary} />
          </div>
        ))}
      </div>

      {/* Charts */}
      {selectedCompanyId && (
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <DreTrendChart data={dreTrend ?? []} isLoading={loadingDre} />
          <TaxBurdenChart data={taxBurden ?? []} isLoading={loadingTax} />
        </div>
      )}

      {!selectedCompanyId && companies.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            Selecione uma empresa para visualizar graficos de DRE e carga tributaria
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {!activity || activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
          ) : (
            <div className="space-y-3">
              {activity.map((item) => (
                <div
                  key={item._id}
                  className="flex items-start gap-3 text-sm border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <Badge variant="outline" className="shrink-0 text-xs mt-0.5">
                    {ACTION_LABELS[item.action] ?? item.action}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      {item.description || `${item.action} em ${item.resource}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.userName} — {dayjs(item.createdAt).fromNow()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
