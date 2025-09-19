import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, KeyRound, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
          <SettingsIcon />
          System Configuration
        </CardTitle>
        <CardDescription>
          Securely configure and manage third-party API keys.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2"><KeyRound className="text-primary"/> AI Service Keys</h3>
            <p className="text-sm text-muted-foreground">API keys for Genkit and Google AI.</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="google-ai-key">Google AI API Key</Label>
              <Input id="google-ai-key" type="password" defaultValue="********************" />
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium flex items-center gap-2"><KeyRound className="text-accent" /> Email Service Keys</h3>
            <p className="text-sm text-muted-foreground">API keys for your email provider (e.g., SendGrid, Mailgun).</p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email-api-key">Email Provider API Key</Label>
              <Input id="email-api-key" type="password" defaultValue="********************" />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="email-from">Default 'From' Email</Label>
              <Input id="email-from" type="email" defaultValue="noreply@learnflow.app" />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
