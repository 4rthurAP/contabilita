import { api } from '@/lib/api';

export interface Tarefa {
  _id: string;
  titulo: string;
  descricao?: string;
  prioridade: string;
  status: string;
  prazo?: string;
  dataConclusao?: string;
  categoria: string;
  companyId?: string;
  userId: string;
  createdAt: string;
}

export interface ProdutividadeItem {
  userId: string;
  userName?: string;
  total: number;
  concluidas: number;
  pendentes: number;
}

export const administrarService = {
  getTarefas: (params?: { status?: string; prioridade?: string; userId?: string }) =>
    api.get('/tarefas', { params }).then((r) => r.data),

  createTarefa: (data: any) =>
    api.post('/tarefas', data).then((r) => r.data),

  updateTarefa: (id: string, data: any) =>
    api.patch(`/tarefas/${id}`, data).then((r) => r.data),

  completeTarefa: (id: string) =>
    api.patch(`/tarefas/${id}/complete`).then((r) => r.data),

  getProductivity: (year: number, month: number) =>
    api.get(`/tarefas/productivity/${year}/${month}`).then((r) => r.data),
};
