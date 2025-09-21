
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center p-4">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        403 - Access Denied
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        You do not have the necessary permissions to access this page.
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Button asChild>
          <Link href="/">Go back to the homepage</Link>
        </Button>
      </div>
    </div>
  );
}
