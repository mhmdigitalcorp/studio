'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Save, History, Video, VideoOff } from 'lucide-react';
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
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const examHistory = [
  { date: '2024-07-20', score: 92, topics: 'Biology, History' },
  { date: '2024-07-15', score: 85, topics: 'Mathematics' },
  { date: '2024-07-10', score: 78, topics: 'Literature, Art' },
];

export default function UserProfilePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description:
            'Please enable camera permissions in your browser settings to use the proctoring features.',
        });
      }
    };

    getCameraPermission();
  }, [toast]);

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
                <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Change Picture
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Alice Johnson" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="alice.j@example.com"
                  disabled
                />
              </div>
            </div>
            <Button className="w-full">
              <Save className="mr-2 h-4 w-4" />
              Update Profile
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
              <Progress value={88} className="flex-1 h-3" />
              <span className="font-bold text-lg text-primary">88%</span>
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
              <Video />
              Proctoring Setup
            </CardTitle>
            <CardDescription>
              Check your camera for AI proctoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video w-full bg-background rounded-md overflow-hidden border">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
            </div>
            {hasCameraPermission === false && (
              <Alert variant="destructive">
                <VideoOff className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera access in your browser settings to use the
                  AI proctoring features.
                </AlertDescription>
              </Alert>
            )}
             {hasCameraPermission === true && (
              <Alert>
                <Video className="h-4 w-4" />
                <AlertTitle>Camera Active</AlertTitle>
                <AlertDescription>
                  Your camera is set up correctly for AI proctoring.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
