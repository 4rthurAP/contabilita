import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * WebSocket Gateway para notificacoes em tempo real.
 *
 * Clientes conectam com JWT token e sao agrupados por tenant+user.
 * O NotificationService chama emitToUser() para push instantaneo.
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server: Server;

  /** Map de userId -> Set<socketId> para broadcast por usuario */
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      const tenantId = payload.tenantId;

      // Associar socket ao usuario
      client.data = { userId, tenantId };

      // Entrar nas salas do tenant e do usuario
      client.join(`tenant:${tenantId}`);
      client.join(`user:${userId}`);

      // Rastrear sockets por usuario
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.debug(`WS connected: user ${userId}, socket ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('mark-read')
  handleMarkRead(client: Socket, data: { notificationId: string }) {
    // Confirmacao de leitura — broadcast para outras abas do mesmo usuario
    const userId = client.data?.userId;
    if (userId) {
      this.server.to(`user:${userId}`).emit('notification:read', {
        notificationId: data.notificationId,
      });
    }
  }

  // ── Metodos publicos para NotificationService ──

  /** Envia notificacao para um usuario especifico */
  emitToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /** Envia notificacao para todos os usuarios de um tenant */
  emitToTenant(tenantId: string, notification: any) {
    this.server.to(`tenant:${tenantId}`).emit('notification:new', notification);
  }

  /** Envia contagem de nao lidas atualizada */
  emitUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('notification:unread-count', { count });
  }

  /** Verifica se um usuario esta online */
  isUserOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }
}
