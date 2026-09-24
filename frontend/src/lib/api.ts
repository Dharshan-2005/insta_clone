import { auth } from '@/auth';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const session = await auth();
    const token = (session as any)?.backendToken;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}

  try {
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}

  return {};
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' };

  if (cleanEndpoint.startsWith('http')) {
    const res = await fetch(cleanEndpoint, {
      ...options,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...headers,
        ...(options.headers || {}),
      },
      cache: options.cache || 'no-store',
    });
    const json = await res.json();
    return json?.data !== undefined ? json.data : json;
  }

  // Server vs Client base URLs
  const isServer = typeof window === 'undefined';
  const candidates: string[] = [];

  if (isServer) {
    if (process.env.INTERNAL_GATEWAY_URL) candidates.push(process.env.INTERNAL_GATEWAY_URL);
    if (process.env.NEXT_PUBLIC_GATEWAY_URL) candidates.push(process.env.NEXT_PUBLIC_GATEWAY_URL);
    if (process.env.NEXT_PUBLIC_API_URL) candidates.push(process.env.NEXT_PUBLIC_API_URL);

    // Prefer Docker service name inside container, localhost outside
    if (process.env.NODE_ENV === 'production') {
      candidates.push('http://api-gateway:3051/api', 'http://localhost:3051/api');
    } else {
      candidates.push('http://localhost:3051/api', 'http://api-gateway:3051/api');
    }
  } else {
    candidates.push('/api/gateway');
  }

  let lastError: any = null;
  for (const base of candidates) {
    const cleanBase = base.replace(/\/+$/, '');
    const url = `${cleanBase}${cleanEndpoint}`;
    try {
      const res = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          ...defaultHeaders,
          ...headers,
          ...(options.headers || {}),
        },
        cache: options.cache || 'no-store',
      });

      if (!res.ok) {
        let errorDetail = '';
        try {
          const errJson = await res.json();
          errorDetail = errJson.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await res.text();
        }
        throw new Error(`API error [${res.status}] ${cleanEndpoint}: ${errorDetail}`);
      }

      const json = await res.json();
      return json?.data !== undefined ? json.data : json;
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error(`Failed to fetch ${cleanEndpoint}`);
}

export * from './api/index';

