import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getGatewayBaseUrl(): string {
  // If explicitly configured
  if (process.env.INTERNAL_GATEWAY_URL) {
    return process.env.INTERNAL_GATEWAY_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_GATEWAY_URL) {
    return process.env.NEXT_PUBLIC_GATEWAY_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  
  // Default: In Docker container use service name, otherwise localhost
  const isDocker = process.env.NODE_ENV === 'production';
  return isDocker ? 'http://api-gateway:3051/api' : 'http://localhost:3051/api';
}

async function forwardRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path ? params.path.join('/') : '';
  const url = new URL(request.url);
  const search = url.search; // includes '?' if present

  // Candidates to try: primary gateway URL, and fallback if in Docker/local mismatch
  const primaryUrl = getGatewayBaseUrl();
  const candidateUrls = [primaryUrl];
  if (primaryUrl.includes('api-gateway:3051')) {
    candidateUrls.push('http://localhost:3051/api');
  } else if (primaryUrl.includes('localhost:3051')) {
    candidateUrls.push('http://api-gateway:3051/api');
  }

  // Extract body if method allows
  let body: ArrayBuffer | undefined = undefined;
  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    try {
      body = await request.arrayBuffer();
    } catch {
      // No body or already consumed
    }
  }

  // Build forward headers
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    // Avoid forwarding host or content-length (let fetch calculate it)
    if (!['host', 'content-length', 'connection'].includes(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  });

  let lastError: any = null;

  for (const baseUrl of candidateUrls) {
    const targetUrl = `${baseUrl}/${path}${search}`;

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        body,
        redirect: 'manual',
      });

      // Prepare response headers
      const resHeaders = new Headers();
      response.headers.forEach((value, key) => {
        if (!['transfer-encoding', 'connection'].includes(key.toLowerCase())) {
          resHeaders.set(key, value);
        }
      });

      // Support multi-value Set-Cookie headers
      const rawSetCookie = (response.headers as any).getSetCookie?.() || [];
      if (rawSetCookie.length > 0) {
        resHeaders.delete('set-cookie');
        rawSetCookie.forEach((cookieStr: string) => {
          resHeaders.append('set-cookie', cookieStr);
        });
      }

      const resBody = await response.arrayBuffer();
      return new NextResponse(resBody, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders,
      });
    } catch (err: any) {
      lastError = err;
      // If network error (ECONNREFUSED or ENOTFOUND), try the next candidate URL
      continue;
    }
  }

  console.error(`[Gateway Proxy] Failed to forward request to ${path}:`, lastError?.message);

  return NextResponse.json(
    {
      success: false,
      message: `Failed to connect to backend service: ${lastError?.message || 'Unknown error'}`,
      code: 'GATEWAY_CONNECTION_ERROR',
    },
    { status: 502 }
  );
}

export const GET = forwardRequest;
export const POST = forwardRequest;
export const PUT = forwardRequest;
export const PATCH = forwardRequest;
export const DELETE = forwardRequest;
export const HEAD = forwardRequest;
