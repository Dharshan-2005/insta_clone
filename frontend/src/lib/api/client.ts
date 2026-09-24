export const GATEWAY_BASE_URL =
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3051/api';

export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_URL ||
  'http://localhost/media';

export function getMediaUrl(path?: string | null): string {
  if (!path || typeof path !== 'string' || path.trim() === '') {
    return '/default-avatar.png';
  }
  const clean = path.trim();

  // 1. Data URLs and Blob URLs: return directly
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // 2. Raw base64 string without data: prefix (legacy / preview)
  if (clean.startsWith('iVBORw0KGgo') || clean.startsWith('/9j/') || (clean.length > 200 && !clean.includes('/') && !clean.includes('.'))) {
    return `data:image/png;base64,${clean}`;
  }

  // 3. Absolute URLs: return directly
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  // 4. Media paths
  if (clean.startsWith('/media/')) {
    return clean;
  }
  if (clean.startsWith('media/')) {
    return `/${clean}`;
  }
  if (clean.startsWith('/uploads/')) {
    return `/media/${clean.replace(/^\/uploads\//, '')}`;
  }
  if (clean.startsWith('uploads/')) {
    return `/media/${clean.replace(/^uploads\//, '')}`;
  }

  // 5. Default relative path mapped to /media/
  return `/media/${clean.replace(/^\//, '')}`;
}

export async function gatewayFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const browserProxyBase = '/api/gateway';
  const baseUrl = typeof window !== 'undefined' ? browserProxyBase : GATEWAY_BASE_URL;
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const requestHeaders = new Headers(options.headers || {});
  if (!isFormData && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: requestHeaders,
  });

  if (!res.ok) {
    let errorDetail = '';
    try {
      const json = await res.json();
      errorDetail = json.message || JSON.stringify(json);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(`Gateway Error [${res.status}] ${endpoint}: ${errorDetail}`);
  }

  const result = await res.json();
  return result?.data !== undefined ? result.data : result;
}
