'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp({ email, password, name, role: 'admin' });
      toast({ title: 'Success', description: 'Admin account created successfully!' });
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Logo />
        </div>
        <CardTitle className="font-headline text-2xl">Create Admin Account</CardTitle>
        <CardDescription>
          Set up a new administrator for the dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                placeholder="Admin User"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Admin Account
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/admin/auth/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
