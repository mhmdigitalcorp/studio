import Link from 'next/link';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/90 px-4 md:px-6 backdrop-blur-sm z-50">
        <Logo />
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 ml-auto">
          <Link
            href="/user/learning"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Learning
          </Link>
          <Link
            href="/user/exam"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Exam
          </Link>
          <Link
            href="/user/profile"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Profile
          </Link>
        </nav>
        <div className="flex items-center gap-4 md:ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-card">
        {children}
      </main>
    </div>
  );
}
