// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedAdminRoutes = [
    '/admin/dashboard',
    '/admin/questions',
    '/admin/users',
    '/admin/emails',
    '/admin/todos',
    '/admin/settings',
    '/admin/profile',
  ];

  if (protectedAdminRoutes.some(p => pathname.startsWith(p))) {
    const tokenCookie = request.cookies.get('firebaseIdToken');

    if (!tokenCookie) {
      const loginUrl = new URL('/admin/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Matcher ensures the middleware runs only on admin pages, excluding auth pages and assets
  matcher: ['/admin/:path*'],
};
