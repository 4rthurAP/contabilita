import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import dayjs from 'dayjs';

const ACTION_BADGE: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-purple-100 text-purple-800',
  action: 'bg-yellow-100 text-yellow-800',
};

export function AuditPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, resource],
    queryFn: () =>
      api.get('/audit', { params: { page, limit: 30, ...(resource && { resource }) } }).then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground">Trilha completa de operacoes do sistema</p>
      </div>

      <div className="flex gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Filtrar recurso</label>
          <Input placeholder="Ex: Company, JournalEntry..." value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }} className="w-60" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : !data?.data || data.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum registro de auditoria</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {data.data.map((log: any) => (
              <Card key={log._id}>
                <CardHeader className="py-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-32">
                        {dayjs(log.createdAt).format('DD/MM/YY HH:mm')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_BADGE[log.action] || 'bg-gray-100'}`}>
                        {log.action}
                      </span>
                      <span className="text-sm font-mono">{log.resource}</span>
                      {log.description && <span className="text-sm text-muted-foreground">{log.description}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.userName || 'Sistema'}
                      {log.changedFields?.length > 0 && (
                        <span className="ml-2">({log.changedFields.join(', ')})</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-sm text-muted-foreground">Pagina {page} de {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>Proxima</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
