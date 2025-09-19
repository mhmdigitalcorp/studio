import { BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ring rounded-sm p-1 -m-1">
      <BrainCircuit className="h-7 w-7 text-primary" />
      <h1 className="font-headline text-2xl font-bold tracking-tighter text-foreground">
        LearnFlow
      </h1>
    </Link>
  );
}
