
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
    const isAuthRoute = pathname.startsWith('/admin/auth') || pathname === '/admin/unauthorized';
    
    // If we're on an auth route, no verification is needed. Let the page render.
    if (isAuthRoute) {
      setIsVerifying(false);
      return;
    }

    // If auth is still loading from Firebase, wait.
    if (authLoading) {
      return;
    }

    // If there's no user context, redirect to login immediately.
    if (!currentUser) {
      router.replace('/admin/auth/login');
      return;
    }

    const verifyAdmin = async () => {
      // If client context says user is not admin, redirect.
      if (currentUser.role !== 'admin') {
        router.replace('/admin/unauthorized');
        return;
      }

      // Final check: verify the token with the server to ensure session is valid.
      try {
        const token = getCookie('firebaseIdToken');
        if (!token) {
          router.replace('/admin/auth/login');
          return;
        }

        const response = await fetch('/api/auth/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
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
        
        // Success! Stop verifying.
        setIsVerifying(false);
        
      } catch (error) {
        console.error('Admin verification error:', error);
        router.replace('/admin/auth/login');
      }
    };

    verifyAdmin();

  }, [currentUser, authLoading, router, pathname]);

  // Show a loader while authentication state is being determined.
  if (isVerifying) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If verification is complete and we are still here, render the children.
  // This covers both the protected admin pages for a verified user and the
  // public auth pages (login, signup, unauthorized).
  return <>{children}</>;
}
