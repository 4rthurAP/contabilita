import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Calculator, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  usePayrollRuns,
  useCreatePayrollRun,
  useCalculatePayroll,
  useApprovePayroll,
  usePayslips,
} from '../hooks/usePayroll';
import { formatMoeda } from '@/utils/formatters';

const d128 = (v: any) => parseFloat(v?.$numberDecimal || v || '0');

const STATUS_BADGE: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-800',
  calculada: 'bg-blue-100 text-blue-800',
  aprovada: 'bg-green-100 text-green-800',
  fechada: 'bg-purple-100 text-purple-800',
};

export function PayrollRunsPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const now = new Date();
  const [newYear, setNewYear] = useState(now.getFullYear());
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const { data: runs, isLoading } = usePayrollRuns(companyId);
  const createRun = useCreatePayrollRun(companyId);
  const calculateRun = useCalculatePayroll(companyId);
  const approveRun = useApprovePayroll(companyId);
  const { data: payslips } = usePayslips(companyId, expandedRun || '');

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Folha de Pagamento</h1>
          <p className="text-muted-foreground">Execucao mensal da folha</p>
        </div>
        <div className="flex items-end gap-2">
          <Input type="number" value={newYear} onChange={(e) => setNewYear(+e.target.value)} className="w-20" />
          <Input type="number" min={1} max={12} value={newMonth} onChange={(e) => setNewMonth(+e.target.value)} className="w-16" />
          <Button onClick={() => createRun.mutate({ year: newYear, month: newMonth })} disabled={createRun.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Folha
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !runs || runs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma folha criada. Crie a primeira folha mensal.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {runs.map((run: any) => (
            <Card key={run._id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-3">
                      <span>
                        {String(run.month).padStart(2, '0')}/{run.year} - {run.tipo}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[run.status]}`}>
                        {run.status}
                      </span>
                    </CardTitle>
                    {run.totalFuncionarios > 0 && (
                      <div className="text-xs text-muted-foreground flex gap-4">
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
                        <Calculator className="mr-1 h-3 w-3" />
                        Calcular
                      </Button>
                    )}
                    {run.status === 'calculada' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setExpandedRun(expandedRun === run._id ? null : run._id)}>
                          <FileText className="mr-1 h-3 w-3" />
                          Holerites
                        </Button>
                        <Button size="sm" onClick={() => approveRun.mutate(run._id)} disabled={approveRun.isPending}>
                          <Check className="mr-1 h-3 w-3" />
                          Aprovar
                        </Button>
                      </>
                    )}
                    {run.status === 'aprovada' && (
                      <Button size="sm" variant="outline" onClick={() => setExpandedRun(expandedRun === run._id ? null : run._id)}>
                        <FileText className="mr-1 h-3 w-3" />
                        Holerites
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Holerites expandidos */}
              {expandedRun === run._id && payslips && (
                <CardContent className="pt-0 space-y-2">
                  <div className="border-t pt-3">
                    {payslips.map((ps: any) => (
                      <div key={ps._id} className="rounded border p-3 mb-2">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium text-sm">{ps.employeeName}</span>
                          <span className="text-sm font-mono">{formatMoeda(d128(ps.salarioLiquido))}</span>
                        </div>
                        <div className="text-xs space-y-0.5">
                          {ps.lines?.map((line: any, i: number) => (
                            <div key={i} className="flex justify-between">
                              <span className={line.tipo === 'desconto' ? 'text-red-600' : line.tipo === 'informativa' ? 'text-muted-foreground' : ''}>
                                {line.codigo} - {line.descricao}
                              </span>
                              <span className={line.tipo === 'desconto' ? 'text-red-600' : line.tipo === 'informativa' ? 'text-muted-foreground' : ''}>
                                {line.tipo === 'desconto' ? '-' : ''}{formatMoeda(d128(line.valor))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
