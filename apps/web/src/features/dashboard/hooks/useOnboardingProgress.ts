import { useCompanies } from '@/features/companies/hooks/useCompanies';
import { useDashboardSummary } from './useDashboard';

export interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export function useOnboardingProgress() {
  const { data: companiesData, isLoading: loadingCompanies } = useCompanies(1);
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();

  const companiesCount = companiesData?.data?.length ?? 0;
  const entriesCount = summary?.entriesThisMonth ?? 0;

  const steps: OnboardingStep[] = [
    {
      key: 'company',
      label: 'Cadastrar empresa',
      description: 'Cadastre a primeira empresa do escritorio',
      href: '/app/companies/new',
      done: companiesCount > 0,
    },
    {
      key: 'accounts',
      label: 'Configurar plano de contas',
      description: 'Importe ou configure as contas contabeis',
      href: '/app/accounting',
      done: (summary?.companiesCount ?? 0) > 0,
    },
    {
      key: 'entry',
      label: 'Primeiro lancamento',
      description: 'Crie o primeiro lancamento contabil',
      href: '/app/accounting/journal-entries/new',
      done: entriesCount > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const isComplete = completedCount === steps.length;
  const isLoading = loadingCompanies || loadingSummary;

  return { steps, completedCount, isComplete, isLoading };
}
