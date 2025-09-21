// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

async function verifyToken(token: string) {
  if (!app) {
    console.error('Firebase Admin SDK not initialized.');
    return null;
  }
  try {
    const decodedToken = await getAuth(app).verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.warn('Invalid or expired token:', error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
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
    const token = request.cookies.get('firebaseIdToken')?.value;

    if (!token) {
      const loginUrl = new URL('/admin/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const decodedToken = await verifyToken(token);

    if (!decodedToken) {
      const loginUrl = new URL('/admin/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (decodedToken.role !== 'admin') {
      // User is authenticated but not an admin, redirect to a dedicated "Unauthorized" page.
      const unauthorizedUrl = new URL('/admin/unauthorized', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
