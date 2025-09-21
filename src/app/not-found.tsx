
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <Search className="h-16 w-16 text-muted-foreground" />
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        404 - Page Not Found
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/">Go back home</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/user/learning">Start Learning →</Link>
        </Button>
      </div>
    </div>
  );
}
