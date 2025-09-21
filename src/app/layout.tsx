import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext';
import HydrationErrorBoundary from '@/components/HydrationErrorBoundary';
import ClientOnly from '@/components/ClientOnly';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LearnFlow - AI-Powered Learning',
  description: 'The future of learning with AI-powered voice lessons and intelligent exams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
         <meta
          name="format-detection"
          content="telephone=no, date=no, email=no, address=no"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen')}>
        <HydrationErrorBoundary>
          <ClientOnly>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ClientOnly>
        </HydrationErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
