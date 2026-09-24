import { gatewayFetch } from './client';
import { Profile } from '@/types';

export async function getOwnProfile(): Promise<Profile> {
  return gatewayFetch<Profile>('/users/profile');
}

export async function updateProfile(data: Partial<Profile>): Promise<Profile> {
  return gatewayFetch<Profile>('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function getUserByUsername(username: string): Promise<Profile> {
  return gatewayFetch<Profile>(`/users/${username}`);
}

export async function getUserByEmail(email: string): Promise<Profile> {
  return gatewayFetch<Profile>(`/users/by-email/${encodeURIComponent(email)}`);
}

export async function getUserById(id: string): Promise<Profile> {
  return gatewayFetch<Profile>(`/users/by-id/${id}`);
}

export async function followUser(userId: string) {
  return gatewayFetch(`/users/${userId}/follow`, { method: 'POST' });
}

export async function unfollowUser(userId: string) {
  return gatewayFetch(`/users/${userId}/follow`, { method: 'DELETE' });
}

export async function searchUsers(q: string): Promise<Profile[]> {
  return gatewayFetch<Profile[]>(`/users/search?q=${encodeURIComponent(q)}`);
}
