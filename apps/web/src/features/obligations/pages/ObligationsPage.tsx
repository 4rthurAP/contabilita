import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Download, Check, Clock, FileCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import dayjs from 'dayjs';

const STATUS_CONFIG: Record<string, { icon: typeof Check; color: string; bg: string }> = {
  pendente: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  gerada: { icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-100' },
  validada: { icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  transmitida: { icon: Check, color: 'text-green-600', bg: 'bg-green-100' },
  retificada: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
};

export function ObligationsPage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId') || '';
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: obligations, isLoading } = useQuery({
    queryKey: ['obligations', companyId, year],
    queryFn: () => api.get(`/companies/${companyId}/obligations`, { params: { year } }).then((r) => r.data),
    enabled: !!companyId,
  });

  const genMonthly = useMutation({
    mutationFn: () => api.post(`/companies/${companyId}/obligations/generate-monthly/${year}/${month}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });

  const genAnnual = useMutation({
    mutationFn: () => api.post(`/companies/${companyId}/obligations/generate-annual/${year}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });

  const genEcd = useMutation({
    mutationFn: () => api.post(`/companies/${companyId}/obligations/sped-ecd/${year}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });

  const genEfd = useMutation({
    mutationFn: () => api.post(`/companies/${companyId}/obligations/sped-efd/${year}/${month}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obligations'] }),
  });

  if (!companyId) {
    return <div className="text-muted-foreground">Selecione uma empresa (?companyId=...)</div>;
  }

  const pendingCount = obligations?.filter((o: any) => o.status === 'pendente').length || 0;
  const overdueCount = obligations?.filter((o: any) =>
    o.status === 'pendente' && new Date(o.prazoEntrega) < new Date()
  ).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Obrigacoes Acessorias</h1>
          <p className="text-muted-foreground">
            SPED, DCTFWeb, EFD-Reinf e demais obrigacoes
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{obligations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total de obrigacoes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">Vencidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ano</label>
          <Input type="number" value={year} onChange={(e) => setYear(+e.target.value)} className="w-24" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mes</label>
          <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(+e.target.value)} className="w-20" />
        </div>
        <Button variant="outline" size="sm" onClick={() => genMonthly.mutate()} disabled={genMonthly.isPending}>
          Gerar Mensais
        </Button>
        <Button variant="outline" size="sm" onClick={() => genAnnual.mutate()} disabled={genAnnual.isPending}>
          Gerar Anuais
        </Button>
        <Button size="sm" onClick={() => genEcd.mutate()} disabled={genEcd.isPending}>
          {genEcd.isPending ? 'Gerando...' : 'Gerar SPED ECD'}
        </Button>
        <Button size="sm" onClick={() => genEfd.mutate()} disabled={genEfd.isPending}>
          {genEfd.isPending ? 'Gerando...' : 'Gerar SPED EFD'}
        </Button>
      </div>

      {/* Obligation list */}
      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !obligations || obligations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Send className="h-12 w-12 mx-auto mb-4" />
            <p>Nenhuma obrigacao cadastrada. Gere as obrigacoes mensais ou anuais.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {obligations.map((obl: any) => {
            const cfg = STATUS_CONFIG[obl.status] || STATUS_CONFIG.pendente;
            const Icon = cfg.icon;
            const isOverdue = obl.status === 'pendente' && new Date(obl.prazoEntrega) < new Date();

            return (
              <Card key={obl._id} className={isOverdue ? 'border-red-300' : ''}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm w-28">{obl.tipo}</span>
                      <span className="text-sm text-muted-foreground">{obl.competencia}</span>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {obl.status}
                      </span>
                      {isOverdue && (
                        <span className="text-xs text-red-600 font-medium">VENCIDA</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Prazo: {dayjs(obl.prazoEntrega).format('DD/MM/YYYY')}
                      </span>
                      {obl.fileName && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/api/companies/${companyId}/obligations/${obl._id}/download`)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {obl.fileName}
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
