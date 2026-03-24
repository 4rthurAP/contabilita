import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/molecules/page-header';
import { CompanyRequired } from '@/components/molecules/company-required';
import { SkeletonTable } from '@/components/molecules/skeleton-table';
import { StatusBadge } from '@/components/molecules/status-badge';
import { REGISTRO_STATUS_MAP } from '@/lib/constants';
import {
  useRegistroDetail,
  useUpdateRegistroStatus,
  useAddAtividade,
  useToggleAtividade,
} from '../hooks/useRegistro';
import type { AtividadeRegistro } from '../services/registro.service';
import dayjs from 'dayjs';

function RegistroDetailContent({ companyId }: { companyId: string }) {
  const { id } = useParams<{ id: string }>();
  const [newDescricao, setNewDescricao] = useState('');
  const [newResponsavel, setNewResponsavel] = useState('');
  const [newPrazo, setNewPrazo] = useState('');

  const { data: registro, isLoading } = useRegistroDetail(companyId, id || '');
  const updateStatus = useUpdateRegistroStatus(companyId);
  const addAtividade = useAddAtividade(companyId, id || '');
  const toggleAtividade = useToggleAtividade(companyId, id || '');

  const handleAddAtividade = () => {
    if (!newDescricao.trim()) return;
    addAtividade.mutate(
      {
        descricao: newDescricao,
        responsavel: newResponsavel || undefined,
        prazo: newPrazo || undefined,
      },
      {
        onSuccess: () => {
          setNewDescricao('');
          setNewResponsavel('');
          setNewPrazo('');
        },
      },
    );
  };

  if (isLoading) return <SkeletonTable rows={5} columns={4} />;
  if (!registro) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Registro - ${registro.tipo}`}
        description={`Criado em ${dayjs(registro.createdAt).format('DD/MM/YYYY')}`}
        breadcrumbs={[{ label: 'Registro', href: '/app/registro' }, { label: 'Detalhes' }]}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              window.history.back()
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        }
      />

      {/* Detalhes do Registro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Detalhes
            <StatusBadge status={registro.status} statusMap={REGISTRO_STATUS_MAP} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Tipo</span>
              <p className="font-medium">
                <Badge variant="info">{registro.tipo}</Badge>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Data Protocolo</span>
              <p className="font-medium">
                {registro.dataProtocolo
                  ? dayjs(registro.dataProtocolo).format('DD/MM/YYYY')
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">NIRE</span>
              <p className="font-mono font-medium">{registro.nire || '—'}</p>
            </div>
          </div>
          {registro.observacoes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Observacoes</span>
              <p>{registro.observacoes}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {registro.status !== 'concluido' && (
              <Button
                size="sm"
                onClick={() =>
                  updateStatus.mutate({ id: registro._id, status: 'concluido' })
                }
                disabled={updateStatus.isPending}
              >
                Marcar como Concluido
              </Button>
            )}
            {registro.status === 'pendente' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updateStatus.mutate({ id: registro._id, status: 'em_andamento' })
                }
                disabled={updateStatus.isPending}
              >
                Iniciar Andamento
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Checklist de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Atividades ({registro.atividades?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {registro.atividades?.map((ativ: AtividadeRegistro) => (
            <div
              key={ativ._id}
              className="flex items-start gap-3 p-3 rounded-md border hover:bg-accent/50 transition-colors"
            >
              <button
                onClick={() => toggleAtividade.mutate(ativ._id)}
                disabled={toggleAtividade.isPending}
                className="mt-0.5 shrink-0"
              >
                {ativ.concluida ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${ativ.concluida ? 'line-through text-muted-foreground' : ''}`}
                >
                  {ativ.descricao}
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                  {ativ.responsavel && <span>Responsavel: {ativ.responsavel}</span>}
                  {ativ.prazo && (
                    <span>Prazo: {dayjs(ativ.prazo).format('DD/MM/YYYY')}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Adicionar nova atividade */}
          <div className="border-t pt-3 space-y-2">
            <p className="text-sm font-medium">Adicionar Atividade</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Descricao da atividade"
                value={newDescricao}
                onChange={(e) => setNewDescricao(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Responsavel"
                value={newResponsavel}
                onChange={(e) => setNewResponsavel(e.target.value)}
                className="sm:w-40"
              />
              <Input
                type="date"
                value={newPrazo}
                onChange={(e) => setNewPrazo(e.target.value)}
                className="sm:w-36"
              />
              <Button
                onClick={handleAddAtividade}
                disabled={addAtividade.isPending || !newDescricao.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RegistroDetailPage() {
  return (
    <CompanyRequired>
      {(companyId) => <RegistroDetailContent companyId={companyId} />}
    </CompanyRequired>
  );
}
