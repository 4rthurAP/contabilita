import { useState } from 'react';
import { Plus, Calculator, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { StatusBadge } from '@/components/molecules/status-badge';
import { PAYROLL_STATUS_MAP } from '@/lib/constants';
import { PayslipDetail } from '../components/payslip-detail';
import {
  usePayrollRuns,
  useCreatePayrollRun,
  useCalculatePayroll,
  useApprovePayroll,
  usePayslips,
} from '../hooks/usePayroll';
import { formatMoeda, d128 } from '@/utils/formatters';

const TIPO_FOLHA_OPTIONS = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'ferias', label: 'Ferias' },
  { value: '13_primeira_parcela', label: '13o — 1a Parcela' },
  { value: '13_segunda_parcela', label: '13o — 2a Parcela' },
  { value: 'rescisao', label: 'Rescisao' },
  { value: 'complementar', label: 'Complementar' },
];

const TIPO_LABEL: Record<string, string> = {
  mensal: 'Mensal',
  ferias: 'Ferias',
  '13_primeira_parcela': '13o 1a Parcela',
  '13_segunda_parcela': '13o 2a Parcela',
  rescisao: 'Rescisao',
  complementar: 'Complementar',
};

function PayrollRunsContent({ companyId }: { companyId: string }) {
  const now = new Date();
  const [newYear, setNewYear] = useState(now.getFullYear());
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);
  const [newTipo, setNewTipo] = useState('mensal');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const { data: runs, isLoading } = usePayrollRuns(companyId);
  const createRun = useCreatePayrollRun(companyId);
  const calculateRun = useCalculatePayroll(companyId);
  const approveRun = useApprovePayroll(companyId);
  const { data: payslips } = usePayslips(companyId, expandedRun || '');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Folha de Pagamento"
        description="Execucao de folha mensal, ferias, 13o e rescisao"
        breadcrumbs={[{ label: 'Folha', href: '/app/payroll/runs' }, { label: 'Folhas de Pagamento' }]}
        actions={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input type="number" value={newYear} onChange={(e) => setNewYear(+e.target.value)} className="w-20" />
            <Input type="number" min={1} max={12} value={newMonth} onChange={(e) => setNewMonth(+e.target.value)} className="w-16" />
            <Select value={newTipo} onChange={(e) => setNewTipo(e.target.value)} className="w-44">
              {TIPO_FOLHA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Button
              onClick={() => createRun.mutate({ year: newYear, month: newMonth, tipo: newTipo })}
              disabled={createRun.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Folha
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : !runs || runs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma folha criada. Selecione o tipo e crie a primeira folha.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {runs.map((run: any) => (
            <Card key={run._id}>
              <CardHeader className="py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex flex-wrap items-center gap-2">
                      <span>
                        {String(run.month).padStart(2, '0')}/{run.year}
                      </span>
                      <span className="text-muted-foreground font-normal">
                        {TIPO_LABEL[run.tipo] ?? run.tipo}
                      </span>
                      <StatusBadge status={run.status} statusMap={PAYROLL_STATUS_MAP} />
                    </CardTitle>
                    {run.totalFuncionarios > 0 && (
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                        <span>{run.totalFuncionarios} funcionario(s)</span>
                        <span>Bruto: {formatMoeda(d128(run.totalBruto))}</span>
                        <span>Liquido: {formatMoeda(d128(run.totalLiquido))}</span>
                        <span>INSS: {formatMoeda(d128(run.totalInss))}</span>
                        <span>IRRF: {formatMoeda(d128(run.totalIrrf))}</span>
                        <span>FGTS: {formatMoeda(d128(run.totalFgts))}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {run.status === 'rascunho' && (
                      <Button size="sm" onClick={() => calculateRun.mutate(run._id)} disabled={calculateRun.isPending}>
                        <Calculator className="mr-1 h-3.5 w-3.5" />
                        Calcular
                      </Button>
                    )}
                    {run.status === 'calculada' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setExpandedRun(expandedRun === run._id ? null : run._id)}>
                          <FileText className="mr-1 h-3.5 w-3.5" />
                          Holerites
                        </Button>
                        <Button size="sm" onClick={() => approveRun.mutate(run._id)} disabled={approveRun.isPending}>
                          <Check className="mr-1 h-3.5 w-3.5" />
                          Aprovar
                        </Button>
                      </>
                    )}
                    {(run.status === 'aprovada' || run.status === 'fechada') && (
                      <Button size="sm" variant="outline" onClick={() => setExpandedRun(expandedRun === run._id ? null : run._id)}>
                        <FileText className="mr-1 h-3.5 w-3.5" />
                        Holerites
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {expandedRun === run._id && payslips && (
                <CardContent className="pt-0 space-y-2">
                  <PayslipDetail payslips={payslips} />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function PayrollRunsPage() {
  return <CompanyRequired>{(companyId) => <PayrollRunsContent companyId={companyId} />}</CompanyRequired>;
}
