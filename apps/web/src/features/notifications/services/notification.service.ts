import { api } from '@/lib/api';

export interface Notification {
  _id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  link?: string;
  lida: boolean;
  createdAt: string;
}

export const notificationService = {
  getAll: (unread?: boolean) =>
    api.get('/notifications', { params: { unread } }).then((r) => r.data),

  markAsRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    api.patch('/notifications/read-all').then((r) => r.data),
};
