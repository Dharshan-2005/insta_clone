import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { cache } from 'react';
import type { Profile } from './types';

const API_URL = process.env.API_URL ?? 'http://api-gateway:3051';

export async function serverApi<T>(path: string): Promise<T> {
  const token = cookies().get('access_token')?.value;
  if (!token) redirect('/auth/login');

  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/auth/login');
  if (res.status === 400 || res.status === 404) notFound();
  if (!res.ok) throw new Error(`Request to ${path} failed with status ${res.status}`);
  return res.json() as Promise<T>;
}

export const getCurrentUser = cache(() => serverApi<Profile>('/users/me'));
