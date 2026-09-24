import { gatewayFetch } from './client';

export async function login(email: string, password?: string) {
  return gatewayFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: password || 'demo1234' }),
  });
}

export async function register(email: string, password?: string, name?: string, username?: string) {
  return gatewayFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: password || 'demo1234',
      name,
      username,
    }),
  });
}

export async function logout() {
  return gatewayFetch('/auth/logout', { method: 'POST' });
}

export async function getMe() {
  return gatewayFetch('/auth/me');
}
