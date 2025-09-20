
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
import { manageSettings, SettingsData } from '@/ai/flows/manage-settings';

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
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [settings, setSettings] = useState<SettingsData>({ provider: 'none', fromEmail: '', aiApiKey: '' });
  const [dialogSettings, setDialogSettings] = useState<SettingsData>({});
  
  const [emailStatus, setEmailStatus] = useState<ServiceStatus>('not-configured');
  const [aiStatus, setAiStatus] = useState<ServiceStatus>('not-configured');
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();
  
  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    const { success, settings: fetchedSettings } = await manageSettings({ action: 'get' });
    if (success && fetchedSettings) {
      setSettings(fetchedSettings);
      // setDialogSettings(fetchedSettings); This is now handled by a dedicated useEffect
      setIsEmailEnabled(fetchedSettings.provider !== 'none');
      setIsAiEnabled(!!fetchedSettings.aiApiKey);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  // This useEffect ensures the dialog state is always in sync with the main settings state.
  useEffect(() => {
    setDialogSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (!isEmailEnabled) {
      setEmailStatus('disabled');
    } else {
      setEmailStatus(settings.provider && settings.provider !== 'none' ? 'operational' : 'not-configured');
    }
    
    if (!isAiEnabled) {
      setAiStatus('disabled');
    } else {
      setAiStatus(settings.aiApiKey ? 'operational' : 'not-configured');
    }
  }, [settings, isEmailEnabled, isAiEnabled]);
  
  const handleSaveSettings = async (updates: Partial<SettingsData>) => {
    setIsSaving(true);
    const newSettings = { ...settings, ...updates };
    const result = await manageSettings({ action: 'set', settingsData: newSettings });

    if (result.success && result.settings) {
        setSettings(result.settings);
        toast({
            title: "Settings Saved",
            description: "Your configuration has been updated.",
        });
        setConfigDialogOpen(false);
    } else {
        toast({ title: "Error Saving Settings", description: result.message, variant: "destructive" });
    }
    setIsSaving(false);
  };
  
  const handleToggleEmailService = (enabled: boolean) => {
    setIsEmailEnabled(enabled);
    if (!enabled) {
        handleSaveSettings({ 
          provider: 'none',
          fromEmail: '',
          sendgridKey: '',
          smtpHost: '',
          smtpPort: '',
          smtpUser: '',
          smtpPass: '',
        });
    }
  };
  
  const handleToggleAiService = (enabled: boolean) => {
    setIsAiEnabled(enabled);
     if (!enabled) {
        handleSaveSettings({ aiApiKey: '' });
    }
  };
  
  const handleTestEmailService = async () => {
    if (!settings.provider || settings.provider === 'none' || !settings.fromEmail) {
      toast({
        title: "Configuration Incomplete",
        description: "Please configure an email provider and a 'From' email address before testing.",
        variant: "destructive"
      });
      return;
    }
    setIsTestingEmail(true);
    try {
        const result = await testEmailService({
            recipient: settings.fromEmail,
        });

        if (result.success) {
            toast({ title: "Test Successful", description: result.message });
             setEmailStatus('operational');
        } else {
            toast({ title: "Test Failed", description: result.message, variant: "destructive" });
            setEmailStatus('degraded');
        }

    } catch (error) {
        toast({ title: "Test Error", description: "An unexpected error occurred.", variant: "destructive" });
        setEmailStatus('degraded');
    }
    setIsTestingEmail(false);
  }

  const handleTestAiService = async () => {
    if (!settings.aiApiKey) return;
    setIsTestingAi(true);
    try {
        const result = await testAiService({ apiKey: settings.aiApiKey });
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

  const validateAndSaveDialogSettings = () => {
    if (dialogSettings.provider === 'sendgrid' && !dialogSettings.sendgridKey) {
      toast({ title: "Validation Error", description: "SendGrid API key is required.", variant: "destructive" });
      return;
    }
    if (dialogSettings.provider === 'smtp') {
      if (!dialogSettings.smtpHost || !dialogSettings.smtpPort || !dialogSettings.smtpUser || !dialogSettings.smtpPass) {
        toast({ title: "Validation Error", description: "All SMTP fields are required.", variant: "destructive" });
        return;
      }
    }
    if ((dialogSettings.provider === 'sendgrid' || dialogSettings.provider === 'smtp') && !dialogSettings.fromEmail) {
      toast({ title: "Validation Error", description: "A 'From' email address is required.", variant: "destructive" });
      return;
    }
    handleSaveSettings(dialogSettings);
  };
  
  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
                    value={settings.aiApiKey || ''}
                    onChange={(e) => setSettings(s => ({ ...s, aiApiKey: e.target.value }))}
                    placeholder="Enter your API key"
                    disabled={!isAiEnabled || isSaving}
                  />
                </div>
                <div className="flex gap-2 self-end">
                    <Button variant="secondary" disabled={!isAiEnabled || !settings.aiApiKey || isSaving} onClick={() => handleSaveSettings({ aiApiKey: settings.aiApiKey })}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Key'}
                    </Button>
                    <Button variant="outline" disabled={!isAiEnabled || !settings.aiApiKey || isTestingAi} onClick={handleTestAiService}>
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
                    {settings.provider && settings.provider !== 'none' ? `Using ${settings.provider}` : 'No provider configured'}
                  </p>
                   {settings.provider && settings.provider !== 'none' && (
                    <p className="text-muted-foreground text-sm mt-1">
                      From: {settings.fromEmail}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setConfigDialogOpen(true)} disabled={!isEmailEnabled}>Configure</Button>
                    <Button variant="secondary" disabled={!isEmailEnabled || !settings.provider || settings.provider === 'none' || isTestingEmail} onClick={handleTestEmailService}>
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
                value={dialogSettings.provider || 'none'} 
                onValueChange={(value) => setDialogSettings(prev => ({...prev, provider: value as EmailService}))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                  <SelectItem value="gmail" disabled>Gmail (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dialogSettings.provider === 'sendgrid' && (
              <div className="space-y-2 p-4 border rounded-md animate-in fade-in-50">
                 <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                 <Input id="sendgrid-key" type="password" placeholder="SG.xxxxxxxx" value={dialogSettings.sendgridKey || ''} onChange={e => setDialogSettings(prev => ({...prev, sendgridKey: e.target.value}))}/>
              </div>
            )}
            
            {dialogSettings.provider === 'smtp' && (
              <div className="space-y-4 p-4 border rounded-md animate-in fade-in-50">
                 <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP Host</Label>
                    <Input id="smtp-host" placeholder="smtp.example.com" value={dialogSettings.smtpHost || ''} onChange={e => setDialogSettings(prev => ({...prev, smtpHost: e.target.value}))}/>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="smtp-port">Port</Label>
                        <Input id="smtp-port" type="number" placeholder="587" value={dialogSettings.smtpPort || ''} onChange={e => setDialogSettings(prev => ({...prev, smtpPort: e.target.value}))}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="smtp-user">Username</Label>
                        <Input id="smtp-user" placeholder="your-username" value={dialogSettings.smtpUser || ''} onChange={e => setDialogSettings(prev => ({...prev, smtpUser: e.target.value}))}/>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="smtp-pass">Password</Label>
                    <Input id="smtp-pass" type="password" value={dialogSettings.smtpPass || ''} onChange={e => setDialogSettings(prev => ({...prev, smtpPass: e.target.value}))}/>
                 </div>
              </div>
            )}

            {(dialogSettings.provider === 'sendgrid' || dialogSettings.provider === 'smtp') && (
              <div className="space-y-2">
                <Label htmlFor="from-email">Default 'From' Email</Label>
                <Input 
                  id="from-email" 
                  type="email" 
                  placeholder="noreply@learnflow.app" 
                  value={dialogSettings.fromEmail || ''}
                  onChange={(e) => setDialogSettings(prev => ({...prev, fromEmail: e.target.value}))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSaving}>Cancel</Button>
            </DialogClose>
            <Button onClick={validateAndSaveDialogSettings} disabled={dialogSettings.provider === 'gmail' || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    