import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  socket ??= io({ transports: ['websocket'] });
  return socket;
}
