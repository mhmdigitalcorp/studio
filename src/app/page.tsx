import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'landing-hero');

  return (
    <div className="relative min-h-screen w-full">
      {heroImage && (
        <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover"
          priority
        />
      )}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4 text-foreground">
        <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
          <Logo />
          <Button variant="ghost" asChild>
            <Link href="/user/auth/login">Sign In</Link>
          </Button>
        </header>

        <main className="flex flex-col items-center text-center">
          <h1 className="font-headline text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl">
            LearnFlow
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            The future of learning is here. AI-powered voice lessons and intelligent exams, tailored just for you.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
            <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <User className="h-6 w-6 text-primary" />
                  <span className="font-headline text-2xl">User Portal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Engage with voice-driven lessons and test your knowledge with our adaptive AI proctor.
                </p>
                <Button className="mt-6 w-full" asChild>
                  <Link href="/user/auth/login">
                    Start Learning <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-accent" />
                  <span className="font-headline text-2xl">Admin Portal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage content, monitor user progress, and configure the platform with powerful admin tools.
                </p>
                <Button variant="accent" className="mt-6 w-full" asChild>
                  <Link href="/admin/auth/login">
                    Go to Dashboard <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        
        <footer className="absolute bottom-0 p-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} LearnFlow. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
}
