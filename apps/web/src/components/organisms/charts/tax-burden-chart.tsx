import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart } from 'lucide-react';

interface TaxBurdenData {
  tipo: string;
  totalRecolher: string;
  totalApurado: string;
}

interface TaxBurdenChartProps {
  data: TaxBurdenData[];
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(340, 75%, 55%)',
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TaxBurdenChart({ data, isLoading }: TaxBurdenChartProps) {
  const chartData = data.map((d) => ({
    tipo: d.tipo,
    valor: parseFloat(d.totalRecolher),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Carga Tributaria por Imposto</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <PieChart className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Sem apuracoes no periodo</p>
            <p className="text-xs text-muted-foreground mt-1">Execute a apuracao fiscal para ver a carga tributaria</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="tipo" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="valor" name="Valor a Recolher" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
