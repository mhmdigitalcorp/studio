// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { app } from '@/lib/firebase-admin';

async function verifyToken(token: string) {
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

  // We only want to protect routes under /admin, excluding the auth pages
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/auth')) {
    const token = request.cookies.get('firebaseIdToken')?.value;

    if (!token) {
      // If no token, redirect to the admin login page
      const loginUrl = new URL('/admin/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    const decodedToken = await verifyToken(token);

    if (!decodedToken) {
      // If token is invalid, redirect to login
      const loginUrl = new URL('/admin/auth/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check for admin role claim. In a real app, this should be set during user creation
    // or via a custom claims function. For this app, we check the 'role' field.
    if (decodedToken.role !== 'admin') {
      // If user is not an admin, redirect them away from the admin portal
      const userUrl = new URL('/user/learning', request.url);
      return NextResponse.redirect(userUrl);
    }

    // If all checks pass, allow the request to proceed
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
