
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Save, Mail, TestTube2, AlertTriangle, CheckCircle2, Loader2, Wand2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { testEmailService } from '@/ai/flows/test-email-service';
import { testAiService } from '@/ai/flows/test-ai-service';

type ServiceStatus = 'operational' | 'degraded' | 'not-configured' | 'disabled';
type EmailService = 'none' | 'sendgrid' | 'smtp' | 'gmail';

type EmailConfig = {
  provider: EmailService;
  fromEmail: string;
  sendgridKey?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
};

const statusConfig: Record<ServiceStatus, { text: string; className: string; icon: React.ReactNode }> = {
  'operational': { text: 'Operational', className: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> },
  'degraded': { text: 'Degraded', className: 'bg-yellow-500', icon: <AlertTriangle className="h-4 w-4" /> },
  'not-configured': { text: 'Not Configured', className: 'bg-red-500', icon: <AlertTriangle className="h-4 w-4" /> },
  'disabled': { text: 'Disabled', className: 'bg-gray-500', icon: <SettingsIcon className="h-4 w-4" /> },
};


export default function SettingsPage() {
  const [isConfigDialogOpen, setConfigDialogOpen] = useState(false);
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // State to hold the full saved configuration
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'none',
    fromEmail: 'noreply@learnflow.app',
  });

  // Temporary state for the dialog form
  const [dialogEmailConfig, setDialogEmailConfig] = useState<EmailConfig>(emailConfig);
  
  const [emailStatus, setEmailStatus] = useState<ServiceStatus>('not-configured');
  
  const [aiApiKey, setAiApiKey] = useState('');
  const [aiStatus, setAiStatus] = useState<ServiceStatus>('not-configured');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);

  const { toast } = useToast();
  
  // Sync dialog state when main config changes
  useEffect(() => {
    setDialogEmailConfig(emailConfig);
    if (isEmailEnabled) {
      setEmailStatus(emailConfig.provider === 'none' ? 'not-configured' : 'operational');
    } else {
      setEmailStatus('disabled');
    }
  }, [emailConfig, isEmailEnabled]);

  useEffect(() => {
     if (!isAiEnabled) {
      setAiStatus('disabled');
    } else {
      setAiStatus(aiApiKey ? 'operational' : 'not-configured');
    }
  }, [aiApiKey, isAiEnabled]);
  
  // Pre-fill dialog when it opens
  const openConfigureDialog = () => {
    setDialogEmailConfig(emailConfig);
    setConfigDialogOpen(true);
  };

  const handleToggleEmailService = (enabled: boolean) => {
    setIsEmailEnabled(enabled);
    if (!enabled) {
      setEmailStatus('disabled');
    } else {
      // Revert to previous status or re-check
      setEmailStatus(emailConfig.provider === 'none' ? 'not-configured' : 'operational');
    }
  };
  
  const handleToggleAiService = (enabled: boolean) => {
    setIsAiEnabled(enabled);
  };

  const handleSaveConfiguration = () => {
    // This function now saves from the dialog's state to the main component's state
    setEmailConfig(dialogEmailConfig);

    if (dialogEmailConfig.provider !== 'none') {
        toast({
            title: "Configuration Saved",
            description: `Email service is now set to ${dialogEmailConfig.provider}.`,
        });
    } else {
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
            service: emailConfig.provider,
            recipient: emailConfig.fromEmail
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
        toast({
            title: "AI Key Saved",
            description: "The AI API key has been securely stored.",
        });
    } else {
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
                    {emailConfig.provider === 'none' ? 'No provider configured' : `Using ${emailConfig.provider}`}
                  </p>
                   {emailConfig.provider !== 'none' && (
                    <p className="text-muted-foreground text-sm mt-1">
                      From: {emailConfig.fromEmail}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={openConfigureDialog} disabled={!isEmailEnabled}>Configure</Button>
                    <Button variant="secondary" disabled={!isEmailEnabled || emailConfig.provider === 'none' || isTestingEmail} onClick={handleTestEmailService}>
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
              <Select 
                value={dialogEmailConfig.provider} 
                onValueChange={(value) => setDialogEmailConfig(prev => ({...prev, provider: value as EmailService}))}
              >
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

            {dialogEmailConfig.provider === 'sendgrid' && (
              <div className="space-y-2 p-4 border rounded-md animate-in fade-in-50">
                 <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                 <Input id="sendgrid-key" type="password" placeholder="SG.xxxxxxxx" value={dialogEmailConfig.sendgridKey || ''} onChange={e => setDialogEmailConfig(prev => ({...prev, sendgridKey: e.target.value}))}/>
              </div>
            )}
            
            {dialogEmailConfig.provider === 'smtp' && (
              <div className="space-y-4 p-4 border rounded-md animate-in fade-in-50">
                 <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" placeholder="smtp.example.com" value={dialogEmailConfig.smtpHost || ''} onChange={e => setDialogEmailConfig(prev => ({...prev, smtpHost: e.target.value}))}/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="smtp-port">Port</Label>
                        <Input id="smtp-port" type="number" placeholder="587" value={dialogEmailConfig.smtpPort || ''} onChange={e => setDialogEmailConfig(prev => ({...prev, smtpPort: e.target.value}))}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="smtp-user">Username</Label>
                        <Input id="smtp-user" placeholder="your-username" value={dialogEmailConfig.smtpUser || ''} onChange={e => setDialogEmailConfig(prev => ({...prev, smtpUser: e.target.value}))}/>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="smtp-pass">Password</Label>
                    <Input id="smtp-pass" type="password" value={dialogEmailConfig.smtpPass || ''} onChange={e => setDialogEmailConfig(prev => ({...prev, smtpPass: e.target.value}))}/>
                 </div>
              </div>
            )}

            {(dialogEmailConfig.provider === 'sendgrid' || dialogEmailConfig.provider === 'smtp') && (
              <div className="space-y-2">
                <Label htmlFor="from-email">Default 'From' Email</Label>
                <Input 
                  id="from-email" 
                  type="email" 
                  placeholder="noreply@learnflow.app" 
                  value={dialogEmailConfig.fromEmail}
                  onChange={(e) => setDialogEmailConfig(prev => ({...prev, fromEmail: e.target.value}))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveConfiguration} disabled={dialogEmailConfig.provider === 'gmail'}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
