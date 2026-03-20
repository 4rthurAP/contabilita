import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { Badge } from '@/components/ui/badge';
import { useTimeEntries, useCreateTimeEntry } from '../hooks/useCustos';
import dayjs from 'dayjs';

const CATEGORIAS = ['contabil', 'fiscal', 'departamento_pessoal', 'consultoria', 'administrativo', 'outros'];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? ` ${m}min` : ''}`;
}

function TimeTrackingContent({ companyId }: { companyId: string }) {
  const [data, setData] = useState(dayjs().format('YYYY-MM-DD'));
  const [duracao, setDuracao] = useState('');
  const [categoria, setCategoria] = useState('contabil');
  const [descricao, setDescricao] = useState('');

  const { data: entries, isLoading } = useTimeEntries(companyId);
  const createEntry = useCreateTimeEntry(companyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEntry.mutate(
      { data, duracao: parseInt(duracao, 10), categoria, descricao },
      {
        onSuccess: () => {
          setDuracao('');
          setDescricao('');
        },
      },
    );
  };

  const columns: Column<any>[] = [
    { key: 'data', header: 'Data', className: 'w-28', render: (e) => dayjs(e.data).format('DD/MM/YYYY') },
    { key: 'categoria', header: 'Categoria', className: 'w-36', render: (e) => <Badge variant="outline" className="capitalize">{e.categoria.replace('_', ' ')}</Badge> },
    { key: 'duracao', header: 'Duracao', className: 'w-24 font-mono', render: (e) => formatDuration(e.duracao) },
    { key: 'descricao', header: 'Descricao', render: (e) => e.descricao || '—' },
    { key: 'usuario', header: 'Usuario', className: 'w-32', hideOnMobile: true, render: (e) => e.userName || '—' },
  ];

  const renderMobileCard = (entry: any) => (
    <ListItemCard
      title={
        <>
          <Badge variant="outline" className="capitalize">{entry.categoria.replace('_', ' ')}</Badge>
          <span className="font-mono text-sm">{formatDuration(entry.duracao)}</span>
        </>
      }
      subtitle={
        <>
          <span>{dayjs(entry.data).format('DD/MM/YYYY')}</span>
          {entry.descricao && <span>{entry.descricao}</span>}
        </>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Apontamento de Horas" description="Registre o tempo dedicado a cada cliente" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Apontamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Duracao (minutos)</Label>
              <Input type="number" placeholder="60" value={duracao} onChange={(e) => setDuracao(e.target.value)} min={1} required />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Descricao</Label>
              <Input placeholder="Descricao da atividade" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" loading={createEntry.isPending}>
                Registrar
              </Button>
            </div>
          </form>
          {createEntry.isError && (
            <p className="text-sm text-destructive mt-2">Erro ao registrar apontamento. Tente novamente.</p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : !entries || entries.length === 0 ? (
        <EmptyState icon={Clock} title="Nenhum apontamento registrado" description="Registre horas trabalhadas usando o formulario acima" />
      ) : (
        <DataTable
          columns={columns}
          data={entries}
          keyExtractor={(e: any) => e._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function TimeTrackingPage() {
  return <CompanyRequired>{(companyId) => <TimeTrackingContent companyId={companyId} />}</CompanyRequired>;
}
