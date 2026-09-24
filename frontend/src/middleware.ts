import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.cookies.has('access_token')) return NextResponse.next();
  return NextResponse.redirect(new URL('/auth/login', request.url));
}

export const config = {
  matcher: ['/((?!auth|_next|favicon.ico).*)'],
};
