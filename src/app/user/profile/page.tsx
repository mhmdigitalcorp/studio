import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Save, History } from 'lucide-react';
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

const examHistory = [
    { date: "2024-07-20", score: 92, topics: "Biology, History" },
    { date: "2024-07-15", score: 85, topics: "Mathematics" },
    { date: "2024-07-10", score: 78, topics: "Literature, Art" },
]

export default function UserProfilePage() {
  return (
    <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
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
                        <Button variant="outline" size="sm">Change Picture</Button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue="Alice Johnson" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" defaultValue="alice.j@example.com" disabled/>
                        </div>
                    </div>
                    <Button className="w-full">
                        <Save className="mr-2 h-4 w-4" />
                        Update Profile
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-2xl flex items-center gap-2">
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
                                        <span className={`font-bold ${exam.score >= 80 ? 'text-green-400' : 'text-orange-400'}`}>
                                            {exam.score}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{exam.topics}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
