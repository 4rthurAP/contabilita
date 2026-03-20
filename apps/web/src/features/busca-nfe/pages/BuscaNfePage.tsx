import { Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { LoadingState } from '@/components/molecules/loading-state';
import { EmptyState } from '@/components/molecules/empty-state';
import { DataTable, type Column } from '@/components/organisms/data-table';
import { ListItemCard } from '@/components/organisms/list-item-card';
import { useBuscaNfeHistory, useFetchNfe } from '../hooks/useBuscaNfe';
import type { BuscaNfeLog } from '../services/busca-nfe.service';
import dayjs from 'dayjs';

function BuscaNfeContent({ companyId }: { companyId: string }) {
  const { data: history, isLoading } = useBuscaNfeHistory(companyId);
  const fetchNfe = useFetchNfe(companyId);

  const columns: Column<BuscaNfeLog>[] = [
    {
      key: 'dataConsulta',
      header: 'Data Consulta',
      className: 'w-36',
      render: (log) => (
        <span className="text-sm">{dayjs(log.dataConsulta).format('DD/MM/YYYY HH:mm')}</span>
      ),
    },
    {
      key: 'quantidadeEncontrada',
      header: 'Encontradas',
      className: 'w-28 text-center',
      render: (log) => <span className="font-mono">{log.quantidadeEncontrada}</span>,
    },
    {
      key: 'quantidadeImportada',
      header: 'Importadas',
      className: 'w-28 text-center',
      render: (log) => (
        <span className="font-mono text-green-600">{log.quantidadeImportada}</span>
      ),
    },
    {
      key: 'ultimoNSU',
      header: 'Ultimo NSU',
      className: 'w-28',
      hideOnMobile: true,
      render: (log) => (
        <span className="font-mono text-xs">{log.ultimoNSU || '—'}</span>
      ),
    },
    {
      key: 'erros',
      header: 'Erros',
      hideOnMobile: true,
      render: (log) =>
        log.erros && log.erros.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {log.erros.map((erro, i) => (
              <Badge key={i} variant="danger" className="text-xs">
                {erro}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Nenhum</span>
        ),
    },
  ];

  const renderMobileCard = (log: BuscaNfeLog) => (
    <ListItemCard
      title={
        <>
          <span className="text-sm">
            {dayjs(log.dataConsulta).format('DD/MM/YYYY HH:mm')}
          </span>
          {log.erros && log.erros.length > 0 && (
            <Badge variant="danger">{log.erros.length} erro(s)</Badge>
          )}
        </>
      }
      subtitle={
        <>
          <span>Encontradas: {log.quantidadeEncontrada}</span>
          <span className="text-green-600">Importadas: {log.quantidadeImportada}</span>
          {log.ultimoNSU && <span>NSU: {log.ultimoNSU}</span>}
        </>
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Busca NF-e"
        description="Consulta de notas fiscais eletronicas na Receita Federal"
      />

      {/* Botao de busca + aviso */}
      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <Button
              size="lg"
              onClick={() => fetchNfe.mutate()}
              disabled={fetchNfe.isPending}
              className="min-w-[260px]"
            >
              <Search className="mr-2 h-5 w-5" />
              {fetchNfe.isPending ? 'Buscando...' : 'Buscar NF-e na Receita'}
            </Button>

            <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-md p-3 max-w-lg">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Funcionalidade stub. A busca automatica de NF-e requer certificado digital
                A1/A3 configurado e comunicacao com o Web Service da SEFAZ/Receita Federal.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historico de buscas */}
      {isLoading ? (
        <LoadingState />
      ) : !history || history.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhuma busca realizada"
          description="Clique no botao acima para consultar NF-e na Receita"
        />
      ) : (
        <DataTable
          columns={columns}
          data={history}
          keyExtractor={(log: BuscaNfeLog) => log._id}
          mobileCard={renderMobileCard}
        />
      )}
    </div>
  );
}

export function BuscaNfePage() {
  return (
    <CompanyRequired>
      {(companyId) => <BuscaNfeContent companyId={companyId} />}
    </CompanyRequired>
  );
}
