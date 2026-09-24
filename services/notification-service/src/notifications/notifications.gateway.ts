import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'ws',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  private extractAndVerifyToken(client: Socket): string | null {
    let token: string | null =
      (client.handshake.auth?.token as string) ||
      (client.handshake.query?.token as string) ||
      (client.handshake.query?.accessToken as string);

    if (!token && client.handshake.headers?.authorization) {
      token = client.handshake.headers.authorization.replace(/^Bearer\s+/i, '');
    }

    if (!token && client.handshake.headers?.cookie) {
      const match = client.handshake.headers.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
      if (match) token = decodeURIComponent(match[1]);
    }

    if (!token) return null;

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
      });
      return payload?.sub || null;
    } catch (err) {
      return null;
    }
  }

  handleConnection(client: Socket) {
    const userId = this.extractAndVerifyToken(client);
    if (userId) {
      client.data.userId = userId;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      this.logger.log(`Authenticated client connected: ${client.id} for user ${userId}`);
    } else {
      this.logger.warn(`Unauthenticated client attempt: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload?: { token?: string },
  ) {
    let userId = client.data?.userId;
    if (!userId && payload?.token) {
      try {
        const decoded = this.jwtService.verify(payload.token, {
          secret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
        });
        if (decoded?.sub) userId = decoded.sub;
      } catch {}
    }

    if (userId) {
      client.data.userId = userId;
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);
      client.join(`user:${userId}`);
      client.emit('authenticated', { status: 'ok', userId });
      this.logger.log(`Authenticated event for ${client.id} -> user ${userId}`);
    } else {
      client.emit('error', { message: 'Invalid or missing authentication token' });
    }
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    if (payload?.conversationId) {
      client.join(`conversation:${payload.conversationId}`);
      this.logger.log(`Client ${client.id} joined conversation:${payload.conversationId}`);
    }
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    if (payload?.conversationId) {
      client.leave(`conversation:${payload.conversationId}`);
      this.logger.log(`Client ${client.id} left conversation:${payload.conversationId}`);
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data?.userId;
    if (payload?.conversationId && userId) {
      client.to(`conversation:${payload.conversationId}`).emit('user_typing', {
        conversationId: payload.conversationId,
        userId,
      });
    }
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.data?.userId;
    if (payload?.conversationId && userId) {
      client.to(`conversation:${payload.conversationId}`).emit('user_stopped_typing', {
        conversationId: payload.conversationId,
        userId,
      });
    }
  }

  sendMessageToConversation(conversationId: string, message: any) {
    this.server.to(`conversation:${conversationId}`).emit('new_message', message);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }

  sendUnreadCountToUser(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('notification_count', { count });
  }
}
