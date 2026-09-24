import { apiFetch } from '../api';
import { Notification } from '@/types';

export interface NotificationsResponse {
  data: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function getNotifications(cursor?: string, limit = 20): Promise<NotificationsResponse> {
  const q = new URLSearchParams();
  if (cursor) q.set('cursor', cursor);
  if (limit) q.set('limit', limit.toString());
  const res = await apiFetch(`/notifications?${q.toString()}`).catch(() => ({ data: [], nextCursor: null, hasMore: false }));
  return {
    data: Array.isArray(res) ? res : res?.data || [],
    nextCursor: res?.nextCursor || null,
    hasMore: Boolean(res?.hasMore),
  };
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch('/notifications/unread-count').catch(() => ({ count: 0 }));
  return res?.count ?? 0;
}

export async function markAsRead(id: string) {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }).catch(() => null);
}

export async function markAllAsRead() {
  return apiFetch('/notifications/read-all', { method: 'PATCH' }).catch(() => null);
}
