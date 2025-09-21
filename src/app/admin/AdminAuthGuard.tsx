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
    let isMounted = true;

    const verifyAdmin = async () => {
      // If auth is still loading, wait.
      if (authLoading) {
        return;
      }
      
      const isAuthRoute = pathname.startsWith('/admin/auth') || pathname === '/admin/unauthorized';

      // On public auth routes, allow access immediately.
      if (isAuthRoute) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      // If auth has loaded and there's no user, redirect to login.
      if (!currentUser) {
        router.replace('/admin/auth/login');
        if (isMounted) setIsVerifying(false);
        return;
      }

      // If user is not an admin, redirect.
      if (currentUser.role !== 'admin') {
        router.replace('/admin/unauthorized');
        if (isMounted) setIsVerifying(false);
        return;
      }

      // Final check: verify the token with the server.
      try {
        const token = getCookie('firebaseIdToken');
        if (!token) {
          router.replace('/admin/auth/login');
          if (isMounted) setIsVerifying(false);
          return;
        }

        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.status === 401) {
          router.replace('/admin/auth/login');
          if (isMounted) setIsVerifying(false);
          return;
        } else if (response.status === 403) {
          router.replace('/admin/unauthorized');
          if (isMounted) setIsVerifying(false);
          return;
        } else if (!response.ok) {
           throw new Error('Token verification failed');
        }
        
        // If we reach here, verification is successful.
        if (isMounted) setIsVerifying(false);

      } catch (error) {
        console.error('Admin verification error:', error);
        router.replace('/admin/auth/login');
        if (isMounted) setIsVerifying(false);
      }
    };

    verifyAdmin();

    return () => {
      isMounted = false;
    };

  }, [currentUser, authLoading, router, pathname]);

  if (isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying access...</span>
      </div>
    );
  }
  
  return <>{children}</>;
}
