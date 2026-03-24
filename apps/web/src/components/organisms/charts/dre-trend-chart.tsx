import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

interface DreTrendData {
  month: string;
  receita: string;
  despesa: string;
  resultado: string;
}

interface DreTrendChartProps {
  data: DreTrendData[];
  isLoading?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(month: string) {
  const [y, m] = month.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

export function DreTrendChart({ data, isLoading }: DreTrendChartProps) {
  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    Receita: parseFloat(d.receita),
    Despesa: parseFloat(d.despesa),
    Resultado: parseFloat(d.resultado),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tendencia DRE</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Sem dados no periodo</p>
            <p className="text-xs text-muted-foreground mt-1">Registre lancamentos contabeis para visualizar tendencias</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Receita"
                stroke="hsl(var(--chart-1))"
                fill="url(#gradReceita)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Despesa"
                stroke="hsl(var(--chart-2))"
                fill="url(#gradDespesa)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Resultado"
                stroke="hsl(var(--chart-3))"
                fill="none"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
