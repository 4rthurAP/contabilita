import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/molecules/page-header';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { EmptyState } from '@/components/molecules/empty-state';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { Badge } from '@/components/ui/badge';
import { useCustosAnalysis } from '../hooks/useCustos';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

const MONTH_NAMES = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function CustosAnalysisPage() {
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(dayjs().month() + 1);

  const { data: analysis, isLoading } = useCustosAnalysis(year, month);

  const totalCusto = analysis?.reduce((s: number, a: any) => s + (a.custoTotal || 0), 0) || 0;
  const totalReceita = analysis?.reduce((s: number, a: any) => s + (a.receita || 0), 0) || 0;
  const totalHoras = analysis?.reduce((s: number, a: any) => s + (a.horasTrabalhadas || 0), 0) || 0;

  const columns: Column<any>[] = [
    { key: 'empresa', header: 'Empresa', render: (a) => <span className="font-medium">{a.empresaNome}</span> },
    { key: 'horas', header: 'Horas', className: 'text-right font-mono w-20', render: (a) => `${(a.horasTrabalhadas ?? 0).toFixed(1)}h` },
    { key: 'custoHora', header: 'Custo/Hora', className: 'text-right font-mono w-28', hideOnMobile: true, render: (a) => formatMoeda(a.custoHora ?? 0) },
    { key: 'custoTotal', header: 'Custo Total', className: 'text-right font-mono w-28', render: (a) => formatMoeda(a.custoTotal ?? 0) },
    { key: 'receita', header: 'Receita', className: 'text-right font-mono w-28', hideOnMobile: true, render: (a) => formatMoeda(a.receita ?? 0) },
    {
      key: 'margem', header: 'Margem', className: 'text-right w-24',
      render: (a) => {
        const margem = (a.margem ?? 0) * 100;
        return (
          <Badge variant={margem >= 30 ? 'success' : margem >= 0 ? 'warning' : 'danger'}>
            {margem.toFixed(1)}%
          </Badge>
        );
      },
    },
  ];

  const renderMobileCard = (a: any) => {
    const margem = (a.margem ?? 0) * 100;
    return (
    <ListItemCard
      title={
        <>
          <span className="font-medium">{a.empresaNome}</span>
          <Badge variant={margem >= 30 ? 'success' : margem >= 0 ? 'warning' : 'danger'}>
            {margem.toFixed(1)}%
          </Badge>
        </>
      }
      subtitle={
        <>
          <span>{(a.horasTrabalhadas ?? 0).toFixed(1)}h trabalhadas</span>
          <span>Custo/h: {formatMoeda(a.custoHora ?? 0)}</span>
        </>
      }
      actions={
        <div className="text-right text-sm">
          <div>Custo: {formatMoeda(a.custoTotal ?? 0)}</div>
          <div>Receita: {formatMoeda(a.receita ?? 0)}</div>
        </div>
      }
    />
  );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analise de Custos"
        description="Custo por cliente e margem de rentabilidade"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="w-auto"
            >
              {MONTH_NAMES.slice(1).map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </Select>
            <Button variant="outline" size="sm" onClick={() => setYear(year - 1)}>
              &larr;
            </Button>
            <span className="text-sm font-medium w-12 text-center">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear(year + 1)}>
              &rarr;
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Horas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoras.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoeda(totalCusto)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoeda(totalReceita)}</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
      ) : !analysis || analysis.length === 0 ? (
        <EmptyState icon={BarChart3} title="Sem dados de analise" description="Registre apontamentos de horas para ver a analise de custos" />
      ) : (
        <DataTable
          columns={columns}
          data={analysis}
          keyExtractor={(a: any) => a.empresaId}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}
