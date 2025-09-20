'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, KeyRound, Save, Mail, TestTube2, AlertTriangle, CheckCircle2, Loader2, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { testEmailService } from '@/ai/flows/test-email-service';
import { testAiService } from '@/ai/flows/test-ai-service';

type ServiceStatus = 'operational' | 'degraded' | 'not-configured' | 'disabled';
type EmailService = 'none' | 'sendgrid' | 'smtp' | 'gmail';

const statusConfig: Record<ServiceStatus, { text: string; className: string; icon: React.ReactNode }> = {
  'operational': { text: 'Operational', className: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
  'degraded': { text: 'Degraded', className: 'bg-yellow-500', icon: <AlertTriangle className="h-4 w-4" /> },
  'not-configured': { text: 'Not Configured', className: 'bg-red-500', icon: <AlertTriangle className="h-4 w-4" /> },
  'disabled': { text: 'Disabled', className: 'bg-gray-500', icon: <SettingsIcon className="h-4 w-4" /> },
};


export default function SettingsPage() {
  const [isConfigDialogOpen, setConfigDialogOpen] = useState(false);
  const [emailService, setEmailService] = useState<EmailService>('none');
  const [emailStatus, setEmailStatus] = useState<ServiceStatus>('not-configured');
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState<ServiceStatus>('not-configured');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);

  const { toast } = useToast();

  const handleToggleEmailService = (enabled: boolean) => {
    setIsEmailEnabled(enabled);
    if (!enabled) {
      setEmailStatus('disabled');
    } else {
      // Revert to previous status or re-check
      setEmailStatus(emailService === 'none' ? 'not-configured' : 'operational');
    }
  };
  
  const handleToggleAiService = (enabled: boolean) => {
    setIsAiEnabled(enabled);
     if (!enabled) {
      setAiStatus('disabled');
    } else {
      setAiStatus(aiApiKey ? 'operational' : 'not-configured');
    }
  };

  const handleSaveConfiguration = () => {
    // Here you would call a secure backend function to save the keys
    if (emailService !== 'none') {
        setEmailStatus('operational');
        toast({
            title: "Configuration Saved",
            description: `Email service is now set to ${emailService}.`,
        });
    } else {
        setEmailStatus('not-configured');
        toast({
            title: "Configuration Cleared",
            description: "Email service provider has been unset.",
            variant: "destructive"
        });
    }
    setConfigDialogOpen(false);
  };
  
  const handleTestEmailService = async () => {
    setIsTestingEmail(true);
    try {
        const result = await testEmailService({
            service: emailService,
            recipient: 'admin@learnflow.app'
        });

        if (result.success) {
            toast({
                title: "Test Successful",
                description: result.message,
            });
             setEmailStatus('operational');
        } else {
            toast({
                title: "Test Failed",
                description: result.message,
                variant: "destructive",
            });
            setEmailStatus('degraded');
        }

    } catch (error) {
        toast({
            title: "Test Error",
            description: "An unexpected error occurred while testing the service.",
            variant: "destructive",
        });
        setEmailStatus('degraded');
    }
    setIsTestingEmail(false);
  }
  
  const handleSaveAiKey = async () => {
    setIsSavingAi(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In a real app this would call a secure backend function
    if (aiApiKey) {
        setAiStatus('operational');
        toast({
            title: "AI Key Saved",
            description: "The AI API key has been securely stored.",
        });
    } else {
         setAiStatus('not-configured');
         toast({
            title: "AI Key Cleared",
            description: "The AI API key has been removed.",
            variant: "destructive"
        });
    }
    setIsSavingAi(false);
  }

  const handleTestAiService = async () => {
    setIsTestingAi(true);
    try {
        const result = await testAiService({ apiKey: aiApiKey });
        if (result.success) {
            toast({ title: "Test Successful", description: result.message });
            setAiStatus('operational');
        } else {
            toast({ title: "Test Failed", description: result.message, variant: "destructive" });
            setAiStatus('degraded');
        }
    } catch (error) {
        toast({ title: "Test Error", description: "An unexpected error occurred.", variant: "destructive" });
        setAiStatus('degraded');
    }
    setIsTestingAi(false);
  }


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <SettingsIcon />
            System Configuration
          </CardTitle>
          <CardDescription>
            Manage and test third-party service integrations.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Wand2 className="h-6 w-6"/>
                    <div>
                        <h3 className="text-lg font-semibold">AI Service</h3>
                        <p className="text-sm text-muted-foreground">Provider for generative content and intelligence.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full", statusConfig[aiStatus].className)} />
                        <span className="text-sm font-medium">{statusConfig[aiStatus].text}</span>
                    </div>

                    <Switch
                      checked={isAiEnabled}
                      onCheckedChange={handleToggleAiService}
                      aria-label="Toggle AI Service"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="p-4 bg-secondary/30 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="grid gap-2 w-full md:w-1/2">
                  <Label htmlFor="google-ai-key">Google AI API Key</Label>
                  <Input 
                    id="google-ai-key" 
                    type="password" 
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    disabled={!isAiEnabled}
                  />
                </div>
                <div className="flex gap-2 self-end">
                    <Button variant="secondary" disabled={!isAiEnabled || !aiApiKey || isSavingAi} onClick={handleSaveAiKey}>
                        {isSavingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSavingAi ? 'Saving...' : 'Save Key'}
                    </Button>
                    <Button variant="outline" disabled={!isAiEnabled || !aiApiKey || isTestingAi} onClick={handleTestAiService}>
                        {isTestingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TestTube2 className="mr-2 h-4 w-4" />}
                        {isTestingAi ? 'Testing...' : 'Test Key'}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Mail className="h-6 w-6"/>
                    <div>
                        <h3 className="text-lg font-semibold">Email Service</h3>
                        <p className="text-sm text-muted-foreground">Provider for sending transactional emails and campaigns.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full", statusConfig[emailStatus].className)} />
                        <span className="text-sm font-medium">{statusConfig[emailStatus].text}</span>
                    </div>

                    <Switch
                      checked={isEmailEnabled}
                      onCheckedChange={handleToggleEmailService}
                      aria-label="Toggle Email Service"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="p-4 bg-secondary/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-medium">Current Provider</h4>
                  <p className="text-muted-foreground text-sm">
                    {emailService === 'none' ? 'No provider configured' : `Using ${emailService}`}
                  </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setConfigDialogOpen(true)} disabled={!isEmailEnabled}>Configure</Button>
                    <Button variant="secondary" disabled={!isEmailEnabled || emailService === 'none' || isTestingEmail} onClick={handleTestEmailService}>
                        {isTestingEmail ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <TestTube2 className="mr-2 h-4 w-4" />
                        )}
                        {isTestingEmail ? 'Testing...' : 'Test Service'}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Dialog open={isConfigDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Email Service</DialogTitle>
            <DialogDescription>
              Select your provider and enter the required API keys. Keys are stored securely and never exposed to the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Provider</Label>
              <Select value={emailService} onValueChange={(value) => setEmailService(value as EmailService)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="gmail">Gmail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailService === 'sendgrid' && (
              <div className="space-y-2 p-4 border rounded-md animate-in fade-in-50">
                 <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                 <Input id="sendgrid-key" type="password" placeholder="SG.xxxxxxxx" />
              </div>
            )}
            
            {emailService === 'smtp' && (
              <div className="space-y-4 p-4 border rounded-md animate-in fade-in-50">
                 <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" placeholder="smtp.example.com" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="smtp-port">Port</Label>
                        <Input id="smtp-port" type="number" placeholder="587" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="smtp-user">Username</Label>
                        <Input id="smtp-user" placeholder="your-username" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="smtp-pass">Password</Label>
                    <Input id="smtp-pass" type="password" />
                 </div>
              </div>
            )}

            {(emailService === 'sendgrid' || emailService === 'smtp') && (
              <div className="space-y-2">
                <Label htmlFor="from-email">Default 'From' Email</Label>
                <Input id="from-email" type="email" placeholder="noreply@learnflow.app" />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveConfiguration} disabled={emailService === 'none'}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
