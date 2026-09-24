import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getNotificationSocket(userId?: string): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4005/ws';
    socket = io(wsUrl, {
      transports: ['websocket'],
      query: userId ? { userId } : {},
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('[ws] connected to notification gateway');
      if (userId) {
        socket?.emit('authenticate', { userId });
      }
    });

    socket.on('disconnect', () => {
      console.log('[ws] disconnected');
    });
  }

  return socket;
}
