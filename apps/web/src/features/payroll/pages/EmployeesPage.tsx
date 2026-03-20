import { useSearchParams } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployees } from '../hooks/usePayroll';
import { formatCpf, formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

const d128 = (v: any) => parseFloat(v?.$numberDecimal || v || '0');

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800',
  afastado: 'bg-yellow-100 text-yellow-800',
  ferias: 'bg-blue-100 text-blue-800',
  demitido: 'bg-red-100 text-red-800',
};

export function EmployeesPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const { data: employees, isLoading } = useEmployees(companyId);

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Funcionarios</h1>
        <p className="text-muted-foreground">Cadastro de funcionarios da empresa</p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !employees || employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum funcionario cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {employees.map((emp: any) => (
            <Card key={emp._id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-3">
                      {emp.nome}
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[emp.status]}`}>
                        {emp.status}
                      </span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>{formatCpf(emp.cpf)}</span>
                      <span>{emp.cargo}</span>
                      {emp.departamento && <span>{emp.departamento}</span>}
                      <span>Admissao: {dayjs(emp.dataAdmissao).format('DD/MM/YYYY')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatMoeda(d128(emp.salarioBase))}</div>
                    <div className="text-xs text-muted-foreground">
                      {emp.dependentes?.length || 0} dependente(s)
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
