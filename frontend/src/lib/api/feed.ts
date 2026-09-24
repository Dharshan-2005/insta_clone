import { apiFetch } from '../api';
import { Post } from '@/types';

export interface FeedResponse {
  data: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function getFeed(cursor?: string, limit = 12): Promise<FeedResponse> {
  const q = new URLSearchParams();
  if (cursor) q.set('cursor', cursor);
  if (limit) q.set('limit', limit.toString());
  const res = await apiFetch(`/feed?${q.toString()}`).catch(() => ({ data: [], nextCursor: null, hasMore: false }));
  return {
    data: Array.isArray(res) ? res : res?.data || [],
    nextCursor: res?.nextCursor || null,
    hasMore: Boolean(res?.hasMore),
  };
}

export async function getExplore(cursor?: string, limit = 18): Promise<FeedResponse> {
  const q = new URLSearchParams();
  if (cursor) q.set('cursor', cursor);
  if (limit) q.set('limit', limit.toString());
  const res = await apiFetch(`/feed/explore?${q.toString()}`).catch(() => ({ data: [], nextCursor: null, hasMore: false }));
  return {
    data: Array.isArray(res) ? res : res?.data || [],
    nextCursor: res?.nextCursor || null,
    hasMore: Boolean(res?.hasMore),
  };
}

export async function refreshFeed() {
  return apiFetch('/feed/refresh', { method: 'POST' });
}
