import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always bypass static files, API routes, media, assets, and icons
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/media') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico' ||
    pathname === '/ig.png' ||
    pathname === '/default-avatar.png' ||
    /\.(png|jpg|jpeg|webp|gif|svg|ico|css|js|woff|woff2)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Check for presence of auth tokens (microservice cookie or NextAuth session cookie)
  const accessToken = request.cookies.get('access_token')?.value;
  const nextAuthToken =
    request.cookies.get('authjs.session-token')?.value ||
    request.cookies.get('__Secure-authjs.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value ||
    request.cookies.get('__Secure-next-auth.session-token')?.value;

  const isAuthenticated = Boolean(accessToken || nextAuthToken);

  // 3. Define public auth pages
  const isAuthPage =
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname === '/auth/forgot';

  // If already authenticated and trying to view login/register, redirect to home
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If not authenticated and already on an auth page, allow access immediately
  // NEVER redirect an auth page to an auth page!
  if (isAuthPage) {
    return NextResponse.next();
  }

  // If not authenticated and attempting to view any protected page, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - media (media uploads)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|media).*)',
  ],
};