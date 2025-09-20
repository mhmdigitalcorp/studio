'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

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
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                <SheetClose asChild>
                  <Link
                    href="/user/learning"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Learning
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/user/exam"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Exam
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href="/user/profile"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Profile
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-8 bg-card">
        <div className="w-full max-w-5xl">
         {children}
        </div>
      </main>
    </div>
  );
}
