'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Save, History, Mic, MicOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { manageUser } from '@/ai/flows/manage-user';

const examHistory = [
  { date: '2024-07-20', score: 92, topics: 'History, Science' },
  { date: '2024-07-15', score: 85, topics: 'General Knowledge' },
  { date: '2024-07-10', score: 78, topics: 'Technology' },
];

export default function UserProfilePage() {
  const { currentUser, loading: authLoading, refreshUser } = useAuth();
  const { micPermission, browserSupportsSpeechRecognition } = useSpeechRecognition();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);

  // Fetch fresh user data when the page loads
  const loadProfile = useCallback(async () => {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  }, [refreshUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
    }
  }, [currentUser]);
  
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
  }

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    const result = await manageUser({
      action: 'update',
      userId: currentUser.uid,
      userData: { name, phone },
    });
    setIsSaving(false);

    if (result.success) {
      toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
      await refreshUser();
    } else {
      toast({ title: 'Update Failed', description: result.message, variant: 'destructive' });
    }
  };

  if (authLoading || isRefreshing) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not Logged In</CardTitle>
          <CardDescription>Please log in to view your profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl flex items-center gap-2">
              <User />
              My Profile
            </CardTitle>
            <CardDescription>
              View and update your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Change Picture
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} disabled={isSaving}/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} disabled={isSaving}/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentUser.email || ''}
                  disabled
                />
              </div>
            </div>
            <Button className="w-full" onClick={handleUpdateProfile} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl flex items-center gap-2">
              <History />
              Learning & Exam History
            </CardTitle>
            <CardDescription>
              Review your past performance and progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold mb-2">Overall Progress</h4>
            <div className="flex items-center gap-4 mb-6">
              <Progress value={currentUser.progress || 0} className="flex-1 h-3" />
              <span className="font-bold text-lg text-primary">{currentUser.progress || 0}%</span>
            </div>

            <Separator className="my-6" />

            <h4 className="font-semibold mb-4">Recent Exams</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Topics</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examHistory.map((exam, i) => (
                    <TableRow key={i}>
                      <TableCell>{exam.date}</TableCell>
                      <TableCell>
                        <span
                          className={`font-bold ${
                            exam.score >= 80
                              ? 'text-green-400'
                              : 'text-orange-400'
                          }`}
                        >
                          {exam.score}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {exam.topics}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-xl md:text-2xl flex items-center gap-2">
              <Mic />
              Voice Interaction Setup
            </CardTitle>
            <CardDescription>
              Check your microphone for voice-based exams.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!browserSupportsSpeechRecognition ? (
               <Alert variant="destructive">
                <MicOff className="h-4 w-4" />
                <AlertTitle>Voice Recognition Not Supported</AlertTitle>
                <AlertDescription>
                  Your browser does not support the Web Speech API. Please switch to a browser like Chrome or Edge. You can still use the text input for exams.
                </AlertDescription>
              </Alert>
            ) : micPermission === 'denied' ? (
              <Alert variant="destructive">
                <MicOff className="h-4 w-4" />
                <AlertTitle>Microphone Access Required</AlertTitle>
                <AlertDescription>
                  Please allow microphone access in your browser settings to use the voice features. You can still use the text input for exams.
                </AlertDescription>
              </Alert>
            ) : micPermission === 'granted' ? (
              <Alert>
                <Mic className="h-4 w-4" />
                <AlertTitle>Microphone Active</AlertTitle>
                <AlertDescription>
                  Your microphone is set up correctly for voice interaction.
                </AlertDescription>
              </Alert>
            ) : (
               <Alert>
                <Mic className="h-4 w-4" />
                <AlertTitle>Microphone Access</AlertTitle>
                <AlertDescription>
                  Microphone access will be requested when you start an exam.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
