import { gatewayFetch } from './client';
import { Post, Comment } from '@/types';

export async function createPost(file: File, caption?: string): Promise<Post> {
  const formData = new FormData();
  formData.append('file', file);
  if (caption) formData.append('caption', caption);

  const res = await fetch('/api/gateway/posts', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!res.ok) throw new Error(`Failed to upload post: ${res.statusText}`);
  const json = await res.json();
  return json.data;
}

export async function getPost(id: string): Promise<Post> {
  return gatewayFetch<Post>(`/posts/${id}`);
}

export async function deletePost(id: string) {
  return gatewayFetch(`/posts/${id}`, { method: 'DELETE' });
}

export async function browsePosts(cursor?: string, limit = 12) {
  const q = new URLSearchParams();
  if (cursor) q.set('cursor', cursor);
  if (limit) q.set('limit', limit.toString());
  return gatewayFetch(`/posts/browse?${q.toString()}`);
}

export async function getUserPosts(userId: string, cursor?: string, limit = 12) {
  const q = new URLSearchParams();
  if (cursor) q.set('cursor', cursor);
  if (limit) q.set('limit', limit.toString());
  return gatewayFetch(`/posts/user/${userId}?${q.toString()}`);
}

export async function likePost(postId: string) {
  return gatewayFetch(`/posts/${postId}/like`, { method: 'POST' });
}

export async function unlikePost(postId: string) {
  return gatewayFetch(`/posts/${postId}/like`, { method: 'DELETE' });
}

export async function bookmarkPost(postId: string) {
  return gatewayFetch(`/posts/${postId}/bookmark`, { method: 'POST' });
}

export async function unbookmarkPost(postId: string) {
  return gatewayFetch(`/posts/${postId}/bookmark`, { method: 'DELETE' });
}

export async function getBookmarkedPosts() {
  return gatewayFetch(`/posts/bookmarked`);
}

export async function addComment(postId: string, text: string): Promise<Comment> {
  return gatewayFetch<Comment>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function getComments(postId: string): Promise<Comment[]> {
  return gatewayFetch<Comment[]>(`/posts/${postId}/comments`);
}
