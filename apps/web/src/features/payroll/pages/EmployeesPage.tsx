import { Users } from 'lucide-react';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { EMPLOYEE_STATUS_MAP } from '@/lib/constants';
import { useEmployees } from '../hooks/usePayroll';
import { formatCpf, formatMoeda, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

function EmployeesContent({ companyId }: { companyId: string }) {
  const { data: employees, isLoading } = useEmployees(companyId);

  const columns: Column<any>[] = [
    { key: 'nome', header: 'Nome', render: (e) => <span className="font-medium">{e.nome}</span> },
    { key: 'cpf', header: 'CPF', className: 'w-32', hideOnMobile: true, render: (e) => <span className="font-mono text-xs">{formatCpf(e.cpf)}</span> },
    { key: 'cargo', header: 'Cargo', hideOnMobile: true, render: (e) => e.cargo },
    { key: 'status', header: 'Status', className: 'w-24', render: (e) => <StatusBadge status={e.status} statusMap={EMPLOYEE_STATUS_MAP} /> },
    { key: 'salario', header: 'Salario', className: 'text-right font-mono', render: (e) => formatMoeda(d128(e.salarioBase)) },
  ];

  const renderMobileCard = (emp: any) => (
    <ListItemCard
      title={
        <>
          {emp.nome}
          <StatusBadge status={emp.status} statusMap={EMPLOYEE_STATUS_MAP} />
        </>
      }
      subtitle={
        <>
          <span>{formatCpf(emp.cpf)}</span>
          <span>{emp.cargo}</span>
          {emp.departamento && <span>{emp.departamento}</span>}
          <span>Admissao: {dayjs(emp.dataAdmissao).format('DD/MM/YYYY')}</span>
        </>
      }
      actions={
        <div className="text-right">
          <div className="text-sm font-medium">{formatMoeda(d128(emp.salarioBase))}</div>
          <div className="text-xs text-muted-foreground">
            {emp.dependentes?.length || 0} dependente(s)
          </div>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Funcionarios" description="Cadastro de funcionarios da empresa" />

      {isLoading ? (
        <LoadingState />
      ) : !employees || employees.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum funcionario cadastrado" />
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          keyExtractor={(e: any) => e._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function EmployeesPage() {
  return <CompanyRequired>{(companyId) => <EmployeesContent companyId={companyId} />}</CompanyRequired>;
}
