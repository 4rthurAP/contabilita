import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useInvoices, usePostInvoice, useImportXml } from '../hooks/useFiscal';
import { formatMoeda, formatCnpj } from '@/utils/formatters';
import dayjs from 'dayjs';

const STATUS_BADGE: Record<string, string> = {
  rascunho: 'bg-yellow-100 text-yellow-800',
  escriturada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
};

const d128 = (v: any) => parseFloat(v?.$numberDecimal || v || '0');

export function InvoicesPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<string>('');

  const { data, isLoading } = useInvoices(companyId, page, tipo || undefined);
  const postInvoice = usePostInvoice(companyId);
  const importXml = useImportXml(companyId);

  const handleImportXml = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xml';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const xml = await file.text();
      importXml.mutate(xml);
    };
    input.click();
  };

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notas Fiscais</h1>
          <p className="text-muted-foreground">Escrituracao de notas fiscais de entrada e saida</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImportXml} disabled={importXml.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {importXml.isPending ? 'Importando...' : 'Importar XML'}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant={!tipo ? 'default' : 'outline'} size="sm" onClick={() => setTipo('')}>
          Todas
        </Button>
        <Button variant={tipo === 'entrada' ? 'default' : 'outline'} size="sm" onClick={() => setTipo('entrada')}>
          Entrada
        </Button>
        <Button variant={tipo === 'saida' ? 'default' : 'outline'} size="sm" onClick={() => setTipo('saida')}>
          Saida
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : data?.data?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma nota fiscal</p>
            <p className="text-muted-foreground">Importe um XML de NF-e para comecar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data?.data?.map((inv: any) => (
            <Card key={inv._id}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm flex items-center gap-3">
                      <span className="font-mono">NF {inv.numero}/{inv.serie}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[inv.status]}`}>
                        {inv.status}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase">{inv.tipo}</span>
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                      <span>{dayjs(inv.dataEmissao).format('DD/MM/YYYY')}</span>
                      {inv.fornecedorClienteNome && <span>{inv.fornecedorClienteNome}</span>}
                      {inv.fornecedorClienteCnpj && <span>{formatCnpj(inv.fornecedorClienteCnpj)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatMoeda(d128(inv.totalNota))}</div>
                      <div className="text-xs text-muted-foreground">
                        ICMS: {formatMoeda(d128(inv.totalIcms))} | PIS: {formatMoeda(d128(inv.totalPis))} | COFINS: {formatMoeda(d128(inv.totalCofins))}
                      </div>
                    </div>
                    {inv.status === 'rascunho' && (
                      <Button
                        size="sm"
                        onClick={() => postInvoice.mutate(inv._id)}
                        disabled={postInvoice.isPending}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Escriturar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">Pagina {page} de {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>
                Proxima
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
