import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTaxPayments } from '../hooks/useFiscal';
import { fiscalService } from '../services/fiscal.service';
import { formatMoeda } from '@/utils/formatters';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

const STATUS_CONFIG: Record<string, { icon: typeof Check; color: string; label: string }> = {
  pendente: { icon: Clock, color: 'text-yellow-600', label: 'Pendente' },
  paga: { icon: Check, color: 'text-green-600', label: 'Paga' },
  vencida: { icon: AlertCircle, color: 'text-red-600', label: 'Vencida' },
};

const d128 = (v: any) => parseFloat(v?.$numberDecimal || v || '0');

export function TaxPaymentsPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const [statusFilter, setStatusFilter] = useState('');
  const { data: payments, isLoading } = useTaxPayments(companyId, statusFilter || undefined);
  const qc = useQueryClient();

  const handleMarkPaid = async (id: string) => {
    await fiscalService.markPaid(companyId, id, new Date().toISOString());
    qc.invalidateQueries({ queryKey: ['tax-payments'] });
  };

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Guias de Pagamento</h1>
        <p className="text-muted-foreground">DARF, DAS, ISS e outras guias</p>
      </div>

      <div className="flex gap-2">
        <Button variant={!statusFilter ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('')}>
          Todas
        </Button>
        <Button variant={statusFilter === 'pendente' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('pendente')}>
          Pendentes
        </Button>
        <Button variant={statusFilter === 'paga' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('paga')}>
          Pagas
        </Button>
        <Button variant={statusFilter === 'vencida' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('vencida')}>
          Vencidas
        </Button>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !payments || payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhuma guia encontrada. Apure impostos e gere as guias.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment: any) => {
            const cfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pendente;
            const Icon = cfg.icon;
            return (
              <Card key={payment._id}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-sm flex items-center gap-3">
                        <span className="font-mono font-bold">{payment.tipoGuia}</span>
                        <span>{payment.tipo.toUpperCase()}</span>
                        <span className={`flex items-center gap-1 text-xs ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </CardTitle>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        <span>Competencia: {payment.competencia}</span>
                        <span>Vencimento: {dayjs(payment.dataVencimento).format('DD/MM/YYYY')}</span>
                        {payment.codigoReceita && <span>Cod. Receita: {payment.codigoReceita}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatMoeda(d128(payment.valorTotal))}</div>
                      </div>
                      {payment.status === 'pendente' && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(payment._id)}>
                          <Check className="mr-1 h-3 w-3" />
                          Pagar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
