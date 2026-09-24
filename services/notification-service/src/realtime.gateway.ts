import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

const room = (userId: string) => `user:${userId}`;

function readAccessToken(cookieHeader?: string) {
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('access_token='));
  return cookie ? decodeURIComponent(cookie.slice('access_token='.length)) : null;
}

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  handleConnection(client: Socket) {
    const userId = this.authenticate(client);
    if (!userId) {
      client.disconnect(true);
      return;
    }
    client.join(room(userId));
  }

  emit(userIds: string[], event: string, payload: unknown) {
    this.server.to(userIds.map(room)).emit(event, payload);
  }

  private authenticate(client: Socket): string | null {
    const token = readAccessToken(client.handshake.headers.cookie);
    if (!token) return null;
    try {
      const { sub } = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
      return typeof sub === 'string' ? sub : null;
    } catch {
      return null;
    }
  }
}
