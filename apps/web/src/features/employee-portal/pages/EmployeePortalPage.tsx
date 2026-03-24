import { useState } from 'react';
import { User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { StatusBadge } from '@/components/molecules/status-badge';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { EMPLOYEE_STATUS_MAP } from '@/lib/constants';
import { useMyProfile, useMyPayslips, usePayslipDetail } from '../hooks/useEmployeePortal';
import { formatMoeda, formatCpf, d128 } from '@/utils/formatters';
import dayjs from 'dayjs';

const MONTH_NAMES = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function PayslipDetailModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: payslip, isLoading } = usePayslipDetail(id);

  if (isLoading) return <SkeletonTable rows={5} columns={4} />;
  if (!payslip) return null;

  const proventos = payslip.lines?.filter((l: any) => l.tipo === 'provento') || [];
  const descontos = payslip.lines?.filter((l: any) => l.tipo === 'desconto') || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Detalhes do Holerite</CardTitle>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Fechar</button>
      </CardHeader>
      <CardContent className="space-y-4">
        {proventos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Proventos</h4>
            <div className="space-y-1">
              {proventos.map((l: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{l.descricao}</span>
                  <span className="font-mono text-emerald-600">{formatMoeda(d128(l.valor))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {descontos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Descontos</h4>
            <div className="space-y-1">
              {descontos.map((l: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{l.descricao}</span>
                  <span className="font-mono text-destructive">-{formatMoeda(d128(l.valor))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="border-t pt-3 flex justify-between font-bold">
          <span>Salario Liquido</span>
          <span className="font-mono">{formatMoeda(d128(payslip.salarioLiquido))}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeePortalPage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: payslips, isLoading: payslipsLoading } = useMyPayslips();
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null);

  const isLoading = profileLoading || payslipsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Portal do Funcionario" description="Seus dados e holerites" />
        <SkeletonTable rows={5} columns={4} />
      </div>
    );
  }

  const columns: Column<any>[] = [
    { key: 'periodo', header: 'Periodo', render: (p) => <span className="font-medium">{MONTH_NAMES[p.month]} / {p.year}</span> },
    { key: 'bruto', header: 'Bruto', className: 'text-right font-mono', render: (p) => formatMoeda(d128(p.salarioBruto)) },
    { key: 'descontos', header: 'Descontos', className: 'text-right font-mono', hideOnMobile: true, render: (p) => <span className="text-destructive">{formatMoeda(d128(p.totalDescontos))}</span> },
    { key: 'liquido', header: 'Liquido', className: 'text-right font-mono', render: (p) => <span className="font-bold">{formatMoeda(d128(p.salarioLiquido))}</span> },
    {
      key: 'acoes', header: '', className: 'w-20',
      render: (p) => (
        <button className="text-xs text-primary hover:underline" onClick={() => setSelectedPayslip(p._id)}>
          Detalhes
        </button>
      ),
    },
  ];

  const renderMobileCard = (p: any) => (
    <ListItemCard
      title={
        <span className="font-medium">{MONTH_NAMES[p.month]} / {p.year}</span>
      }
      subtitle={
        <>
          <span>Bruto: {formatMoeda(d128(p.salarioBruto))}</span>
          <span>Descontos: {formatMoeda(d128(p.totalDescontos))}</span>
        </>
      }
      actions={
        <div className="text-right">
          <div className="text-sm font-bold">{formatMoeda(d128(p.salarioLiquido))}</div>
          <button className="text-xs text-primary hover:underline" onClick={() => setSelectedPayslip(p._id)}>
            Detalhes
          </button>
        </div>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Portal do Funcionario" description="Seus dados e holerites" />

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Meus Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Nome</div>
                <div className="font-medium">{profile.nome}</div>
              </div>
              <div>
                <div className="text-muted-foreground">CPF</div>
                <div className="font-mono">{formatCpf(profile.cpf)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cargo</div>
                <div>{profile.cargo}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Departamento</div>
                <div>{profile.departamento || '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Salario Base</div>
                <div className="font-mono font-medium">{formatMoeda(d128(profile.salarioBase))}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Admissao</div>
                <div>{dayjs(profile.dataAdmissao).format('DD/MM/YYYY')}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <StatusBadge status={profile.status} statusMap={EMPLOYEE_STATUS_MAP} />
              </div>
              {profile.empresaNome && (
                <div>
                  <div className="text-muted-foreground">Empresa</div>
                  <div>{profile.empresaNome}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPayslip && (
        <PayslipDetailModal id={selectedPayslip} onClose={() => setSelectedPayslip(null)} />
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Holerites</h3>
        {!payslips || payslips.length === 0 ? (
          <EmptyState icon={FileText} title="Nenhum holerite disponivel" />
        ) : (
          <DataTable
            columns={columns}
            data={payslips}
            keyExtractor={(p: any) => p._id}
            mobileCard={renderMobileCard}
          />
        )}
      </div>
    </div>
  );
}
