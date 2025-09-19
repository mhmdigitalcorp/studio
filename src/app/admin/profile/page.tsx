import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Save, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <Shield />
          Admin Profile & Security
        </CardTitle>
        <CardDescription>
          Update your profile information and manage your security settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="https://i.pravatar.cc/150?u=admin-user" />
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <h3 className="text-xl font-semibold">Admin User</h3>
            <p className="text-sm text-muted-foreground">admin@learnflow.app</p>
            <Button variant="outline" size="sm" className="mt-2 w-fit">Change Picture</Button>
          </div>
        </div>
        
        <Separator />

        <div className="grid md:grid-cols-2 gap-6">
           <div className="space-y-4">
            <h4 className="font-medium">Personal Information</h4>
            <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Admin User" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="admin@learnflow.app" />
            </div>
          </div>
          <div className="space-y-4">
             <h4 className="font-medium">Change Password</h4>
            <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
      </CardContent>
    </Card>
  );
}
