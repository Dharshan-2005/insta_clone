import { create } from 'zustand';
import { Notification } from '@/types';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '@/lib/api/notifications';
import { getNotificationSocket } from '@/lib/ws';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  initWs: (userId: string) => void;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  initWs: (userId: string) => {
    const socket = getNotificationSocket(userId);
    if (!socket) return;

    socket.on('new_notification', (notif: Notification) => {
      set((state) => ({
        notifications: [notif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });

    socket.on('notification_count', ({ count }: { count: number }) => {
      set({ unreadCount: count });
    });
  },

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await getNotifications();
      set({ notifications: res.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // ignore
    }
  },

  markRead: async (id: string) => {
    await markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllRead: async () => {
    await markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));
