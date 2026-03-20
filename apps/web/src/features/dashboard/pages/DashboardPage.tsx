import { PageHeader } from '@/components/molecules/page-header';
import { StatCard } from '@/components/molecules/stat-card';
import { useHealth } from '../hooks/useDashboard';
import { Activity, Building2, FileText, Users } from 'lucide-react';

export function DashboardPage() {
  const { data: health } = useHealth();

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visao geral do escritorio contabil" />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Empresas Ativas" value={0} subtitle="Cadastre a primeira empresa" icon={Building2} />
        <StatCard title="Lancamentos do Mes" value={0} subtitle="Nenhum lancamento" icon={FileText} />
        <StatCard title="Funcionarios" value={0} subtitle="Nenhum funcionario" icon={Users} />
        <StatCard
          title="Status API"
          value={health?.status === 'ok' ? 'Online' : '...'}
          subtitle={`MongoDB: ${health?.services?.mongodb || '...'}`}
          icon={Activity}
        />
      </div>
    </div>
  );
}
