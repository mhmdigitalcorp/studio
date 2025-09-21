'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getCookie } from 'cookies-next';

export default function AdminAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // If auth is still loading, wait.
    if (authLoading) {
      return;
    }

    const verifyAdmin = async () => {
      // If client-side context says no user, redirect immediately.
      if (!currentUser) {
        router.replace('/admin/auth/login');
        return;
      }
      
      // If client-side context says user is not admin, redirect.
      if (currentUser.role !== 'admin') {
        router.replace('/admin/unauthorized');
        return;
      }

      // For an extra layer of security, verify the token against a server endpoint.
      // This protects against a stale client-side session.
      try {
        const token = getCookie('firebaseIdToken');
        if (!token) {
          router.replace('/admin/auth/login');
          return;
        }

        const response = await fetch('/api/auth/verify-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
           router.replace('/admin/auth/login');
           return;
        }

        if (response.status === 403) {
            router.replace('/admin/unauthorized');
            return;
        }
        
        if (!response.ok) {
           throw new Error('Token verification failed');
        }
        
      } catch (error) {
        console.error('Admin verification error:', error);
        router.replace('/admin/auth/login');
        return;
      } finally {
        setIsVerifying(false);
      }
    };

    // Don't run verification on auth pages themselves
    if (!pathname.startsWith('/admin/auth')) {
        verifyAdmin();
    } else {
        setIsVerifying(false);
    }

  }, [currentUser, authLoading, router, pathname]);

  if (authLoading || isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If on an auth page, just render children (the login form)
  if (pathname.startsWith('/admin/auth')) {
    return <>{children}</>;
  }
  
  // If user is verified as admin, render the admin layout
  if (currentUser && currentUser.role === 'admin') {
    return <>{children}</>;
  }

  // Fallback, should ideally be covered by redirects
  return null;
}
