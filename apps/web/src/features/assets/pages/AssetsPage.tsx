import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatMoeda } from '@/utils/formatters';
import dayjs from 'dayjs';

const d128 = (v: any) => parseFloat(v?.$numberDecimal || v || '0');

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800',
  baixado: 'bg-red-100 text-red-800',
  transferido: 'bg-blue-100 text-blue-800',
};

export function AssetsPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const qc = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', companyId],
    queryFn: () => api.get(`/companies/${companyId}/assets`).then((r) => r.data),
    enabled: !!companyId,
  });

  const depreciate = useMutation({
    mutationFn: () => {
      const now = new Date();
      return api.post(`/companies/${companyId}/assets/depreciate/${now.getFullYear()}/${now.getMonth() + 1}`).then((r) => r.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patrimonio</h1>
          <p className="text-muted-foreground">Controle de bens e depreciacao</p>
        </div>
        <Button onClick={() => depreciate.mutate()} disabled={depreciate.isPending}>
          {depreciate.isPending ? 'Depreciando...' : 'Depreciar Mes Atual'}
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !assets || assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum bem cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {assets.map((asset: any) => (
            <Card key={asset._id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm flex items-center gap-3">
                      <span className="font-mono text-muted-foreground">{asset.codigo}</span>
                      <span>{asset.descricao}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[asset.status]}`}>
                        {asset.status}
                      </span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex gap-4">
                      <span>{asset.grupo}</span>
                      <span>Aquisicao: {dayjs(asset.dataAquisicao).format('DD/MM/YYYY')}</span>
                      <span>Metodo: {asset.metodoDepreciacao}</span>
                      <span>Taxa: {(d128(asset.taxaDepreciacao) * 100).toFixed(0)}% a.a.</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div>Aquisicao: {formatMoeda(d128(asset.valorAquisicao))}</div>
                    <div className="text-red-600">Deprec.: -{formatMoeda(d128(asset.depreciacaoAcumulada))}</div>
                    <div className="font-medium">Atual: {formatMoeda(d128(asset.valorAtual))}</div>
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
