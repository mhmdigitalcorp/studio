
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Wand2,
  Send,
  Loader2,
  PlusCircle,
  ArrowLeft,
  Users,
  Calendar,
  MoreHorizontal,
  FileText,
  Save,
  Trash2,
  Edit,
  Search,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  generateEmailCampaign,
  GenerateEmailCampaignInput,
  GenerateEmailCampaignOutput,
} from '@/ai/flows/generate-email-campaigns';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Campaign, User } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { manageUser } from '@/ai/flows/manage-user';
import { manageSettings, SettingsData } from '@/ai/flows/manage-settings';

type ViewMode = 'manager' | 'composer';
type ServiceStatus = 'operational' | 'degraded' | 'not-configured';

const getInitialComposerState = () => ({
  id: null as string | null,
  recipientSelection: {
    type: 'segment' as 'segment' | 'custom' | 'manual',
    segment: 'all',
    custom: [] as string[],
    manual: '',
  },
  subject: '',
  body: '',
  sendNow: true,
  scheduledAt: new Date(),
});

const statusConfig: Record<
  ServiceStatus,
  { text: string; className: string; icon: React.ReactNode }
> = {
  operational: {
    text: 'Operational',
    className: 'bg-green-500',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  degraded: {
    text: 'Degraded',
    className: 'bg-yellow-500',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  'not-configured': {
    text: 'Not Configured',
    className: 'bg-red-500',
    icon: <Settings className="h-4 w-4" />,
  },
};

const CampaignManagerView = ({
  campaigns,
  handleOpenCreate,
  handleOpenEdit,
  handleOpenDeleteDialog,
  currentStatus,
}: {
  campaigns: Campaign[];
  handleOpenCreate: () => void;
  handleOpenEdit: (campaign: Campaign) => void;
  handleOpenDeleteDialog: (campaign: Campaign) => void;
  currentStatus: { text: string; className: string; icon: React.ReactNode };
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
        <div>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Mail />
            Email Campaigns
          </CardTitle>
          <CardDescription>
            View, manage, and create your email campaigns.
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 text-sm font-medium p-2 rounded-md bg-secondary"
          >
            <div className={cn('h-2.5 w-2.5 rounded-full', currentStatus.className)} />
            <span>Email Service: {currentStatus.text}</span>
          </Link>
          <Button onClick={handleOpenCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Sent/Scheduled</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map(campaign => (
            <TableRow key={campaign.id}>
              <TableCell className="font-medium">{campaign.subject}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    campaign.status === 'Sent'
                      ? 'default'
                      : campaign.status === 'Draft'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {campaign.status}
                </Badge>
              </TableCell>
              <TableCell>{campaign.recipients}</TableCell>
              <TableCell>
                {campaign.date === 'N/A'
                  ? 'N/A'
                  : format(new Date(campaign.date), 'PPP p')}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenEdit(campaign)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleOpenDeleteDialog(campaign)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

const ComposerView = ({
  composerState,
  setComposerState,
  setView,
  userSearchTerm,
  setUserSearchTerm,
  filteredUsers,
  handleCustomUserSelect,
  setAiFormState,
  setAiModalOpen,
  handleSave,
  isSaving,
}: {
  composerState: ReturnType<typeof getInitialComposerState>;
  setComposerState: React.Dispatch<
    React.SetStateAction<ReturnType<typeof getInitialComposerState>>
  >;
  setView: (view: ViewMode) => void;
  userSearchTerm: string;
  setUserSearchTerm: (term: string) => void;
  filteredUsers: User[];
  handleCustomUserSelect: (userId: string) => void;
  setAiFormState: React.Dispatch<React.SetStateAction<Omit<GenerateEmailCampaignInput, 'targetAudience'>>>;
  setAiModalOpen: (isOpen: boolean) => void;
  handleSave: (status: 'Draft' | 'Scheduled' | 'Sent') => void;
  isSaving: boolean;
}) => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <Button variant="outline" size="icon" onClick={() => setView('manager')}>
        <ArrowLeft />
      </Button>
      <h2 className="font-headline text-2xl">
        {composerState.id ? 'Edit Campaign' : 'Create New Campaign'}
      </h2>
    </div>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users />
          Recipient Segmentation
        </CardTitle>
        <CardDescription>Choose who this email will be sent to.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={composerState.recipientSelection.type}
          onValueChange={value =>
            setComposerState(prev => ({
              ...prev,
              recipientSelection: {
                ...prev.recipientSelection,
                type: value as any,
                custom: [],
                manual: '',
              },
            }))
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="segment">Segments</TabsTrigger>
            <TabsTrigger value="custom">Custom List</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          <TabsContent value="segment" className="pt-4">
            <Select
              value={composerState.recipientSelection.segment}
              onValueChange={value =>
                setComposerState(prev => ({
                  ...prev,
                  recipientSelection: { ...prev.recipientSelection, segment: value },
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a user segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="not-started">
                  Users who haven't started learning
                </SelectItem>
                <SelectItem value="completed-exam">Users with completed exams</SelectItem>
                <SelectItem value="score-gt-80">Users with exam score > 80%</SelectItem>
              </SelectContent>
            </Select>
          </TabsContent>
          <TabsContent value="custom" className="pt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-10"
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
              />
            </div>
            <ScrollArea className="h-64 rounded-md border">
              <div className="p-4">
                {filteredUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={composerState.recipientSelection.custom.includes(user.id)}
                      onCheckedChange={() => handleCustomUserSelect(user.id)}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="flex-1 flex items-center gap-2 cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-sm text-muted-foreground">
              {composerState.recipientSelection.custom.length} user(s) selected.
            </p>
          </TabsContent>
          <TabsContent value="manual" className="pt-4">
            <Label htmlFor="manual-emails">Manual Email Entry</Label>
            <Textarea
              id="manual-emails"
              placeholder="Enter email addresses, separated by commas"
              rows={8}
              value={composerState.recipientSelection.manual}
              onChange={e =>
                setComposerState(prev => ({
                  ...prev,
                  recipientSelection: {
                    ...prev.recipientSelection,
                    manual: e.target.value,
                  },
                }))
              }
            />
            <p className="text-sm text-muted-foreground mt-2">Emails should be comma-separated.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText />
              Email Content
            </CardTitle>
            <CardDescription>
              Write your email manually or generate it with AI.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setAiFormState({
                emailType: 'newsletter',
                tone: 'friendly',
                topic: '',
                additionalInstructions: '',
              });
              setAiModalOpen(true);
            }}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="subject">Subject Line</Label>
          <Input
            id="subject"
            placeholder="Your campaign subject"
            value={composerState.subject}
            onChange={e =>
              setComposerState(prev => ({ ...prev, subject: e.target.value }))
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="body">Content Body (Markdown supported)</Label>
          <Textarea
            id="body"
            rows={15}
            placeholder="Write your email here..."
            value={composerState.body}
            onChange={e => setComposerState(prev => ({ ...prev, body: e.target.value }))}
          />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar />
          Scheduling & Sending
        </CardTitle>
        <CardDescription>Choose when to send your campaign.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="send-now"
            checked={composerState.sendNow}
            onCheckedChange={checked =>
              setComposerState(prev => ({ ...prev, sendNow: checked }))
            }
          />
          <Label htmlFor="send-now">
            {composerState.sendNow ? 'Send Immediately' : 'Schedule for Later'}
          </Label>
        </div>
        {!composerState.sendNow && (
          <Input
            type="datetime-local"
            value={format(new Date(composerState.scheduledAt), "yyyy-MM-dd'T'HH:mm")}
            onChange={e =>
              setComposerState(prev => ({
                ...prev,
                scheduledAt: new Date(e.target.value),
              }))
            }
            min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          />
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => handleSave('Draft')}
          disabled={isSaving}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Draft
        </Button>
        {composerState.sendNow ? (
          <Button onClick={() => handleSave('Sent')} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Sending...' : 'Send Now'}
          </Button>
        ) : (
          <Button onClick={() => handleSave('Scheduled')} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Scheduling...' : 'Schedule'}
          </Button>
        )}
      </CardFooter>
    </Card>
  </div>
);

// Mock data fetching functions
const fetchCampaigns = async (): Promise<Campaign[]> => {
  await new Promise(res => setTimeout(res, 500));
  return [
    { id: 'camp_1', subject: 'New Feature: Voice-Activated Lessons!', body: '## Discover a new way to learn!\n...', status: 'Sent', recipients: 'all', date: '2024-07-20T10:00:00.000Z' },
    { id: 'camp_2', subject: 'Mid-Week Learning Reminder', body: '### Keep the momentum going!\n...', status: 'Scheduled', recipients: 'not-started', date: '2024-08-01T10:00:00.000Z' },
  ];
}


export default function EmailsPage() {
  const [view, setView] = useState<ViewMode>('manager');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [composerState, setComposerState] = useState(getInitialComposerState());
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const { toast } = useToast();

  const [settings, setSettings] = useState<SettingsData | null>(null);

  const [aiFormState, setAiFormState] = useState<
    Omit<GenerateEmailCampaignInput, 'targetAudience'>
  >({
    emailType: 'newsletter',
    tone: 'friendly',
    topic: '',
    additionalInstructions: '',
  });
  
  const emailServiceStatus = useMemo<ServiceStatus>(() => {
    if (!settings || !settings.provider || settings.provider === 'none') {
      return 'not-configured';
    }
    return 'operational'; // Can be expanded with a test check
  }, [settings]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const { success: settingsSuccess, settings: fetchedSettings } = await manageSettings({ action: 'get' });
      if (settingsSuccess) {
        setSettings(fetchedSettings || null);
      }

      const { success: usersSuccess, users: fetchedUsers } = await manageUser({ action: 'getAll' });
      if (usersSuccess) {
        setAllUsers(fetchedUsers || []);
      }
      
      const fetchedCampaigns = await fetchCampaigns();
      setCampaigns(fetchedCampaigns);
      
      setIsLoading(false);
    }
    loadData();
  }, []);

  const getRecipientSummary = useCallback(() => {
    const { type, segment, custom, manual } = composerState.recipientSelection;
    switch (type) {
      case 'custom':
        return `${custom.length} custom user(s)`;
      case 'manual':
        const count = manual.split(',').filter(e => e.trim()).length;
        return `${count} manual email(s)`;
      case 'segment':
      default:
        // In a real app, you'd calculate segment size. Here we'll estimate.
        return 'Segment: ' + (recipientLabels[segment] || segment);
    }
  }, [composerState.recipientSelection]);

  const handleGenerateWithAi = useCallback(async () => {
    setIsGenerating(true);
    try {
      const targetAudience = getRecipientSummary();
      const result = await generateEmailCampaign({ ...aiFormState, emailType: aiFormState.emailType as any, tone: aiFormState.tone as any, targetAudience });
      setComposerState(prev => ({ ...prev, subject: result.subject, body: result.body }));
      setAiModalOpen(false);
    } catch (error) {
      console.error('Failed to generate email campaign:', error);
      toast({
        title: 'Generation Failed',
        description: 'Could not generate email content with AI.',
        variant: 'destructive',
      });
    }
    setIsGenerating(false);
  }, [aiFormState, getRecipientSummary, toast]);

  const handleOpenCreate = useCallback(() => {
    setComposerState(getInitialComposerState());
    setView('composer');
  }, []);

  const handleOpenEdit = useCallback((campaign: Campaign) => {
    setComposerState({
      ...getInitialComposerState(),
      id: campaign.id,
      subject: campaign.subject,
      body: campaign.body,
      sendNow: campaign.status !== 'Scheduled',
      scheduledAt: campaign.date !== 'N/A' ? new Date(campaign.date) : new Date(),
    });
    setView('composer');
  }, []);

  const handleOpenDeleteDialog = useCallback((campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteCampaign = useCallback(() => {
    if (campaignToDelete) {
      setCampaigns(campaigns.filter(c => c.id !== campaignToDelete.id));
      toast({ title: 'Campaign Deleted' });
      setDeleteDialogOpen(false);
      setCampaignToDelete(null);
    }
  }, [campaignToDelete, campaigns, toast]);

  const getRecipientCount = useCallback(() => {
    const { type, segment, custom, manual } = composerState.recipientSelection;
    switch (type) {
      case 'custom':
        return custom.length;
      case 'manual':
        return manual.split(',').filter(e => e.trim()).length;
      case 'segment':
        return allUsers.length;
      default:
        return 0;
    }
  }, [composerState.recipientSelection, allUsers.length]);

  const handleSave = useCallback(
    async (status: 'Draft' | 'Scheduled' | 'Sent') => {
      setIsSaving(true);

      if (status === 'Sent') {
         if (emailServiceStatus !== 'operational') {
           toast({
             title: 'Email Send Failed',
             description: 'Email service is not configured. Please configure it in Settings.',
             variant: 'destructive',
           });
           setIsSaving(false);
           return;
         }
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast({
          title: 'Email Sent Successfully!',
          description: `Your campaign "${composerState.subject}" was sent to ${getRecipientCount()} recipient(s).`,
        });
      }

      const recipientsSummary = getRecipientSummary();
      const campaignData = {
        subject: composerState.subject,
        body: composerState.body,
        recipients: recipientsSummary,
        status,
        date:
          status === 'Draft'
            ? 'N/A'
            : (composerState.sendNow
                ? new Date()
                : composerState.scheduledAt
              ).toISOString(),
      };

      if (composerState.id) {
        setCampaigns(campaigns.map(c => (c.id === composerState.id ? { ...c, ...campaignData, id: c.id } : c)));
      } else {
        const newCampaign: Campaign = {
          id: `camp_${Date.now()}`,
          ...campaignData,
        };
        setCampaigns(c => [newCampaign, ...c]);
      }

      if (status !== 'Sent') {
          toast({ title: `Campaign ${status}`});
      }
      setIsSaving(false);
      setView('manager');
    },
    [composerState, campaigns, getRecipientCount, getRecipientSummary, toast, emailServiceStatus]
  );

  const recipientLabels: { [key: string]: string } = useMemo(
    () => ({
      all: 'All Users',
      'not-started': "Users who haven't started",
      'completed-exam': 'Users with completed exams',
      'score-gt-80': 'High-scoring users (>80%)',
    }),
    []
  );

  const filteredUsers = useMemo(() => {
    return allUsers.filter(
      user =>
        user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [userSearchTerm, allUsers]);

  const handleCustomUserSelect = useCallback((userId: string) => {
    setComposerState(prev => {
      const currentSelection = prev.recipientSelection.custom;
      const newSelection = currentSelection.includes(userId)
        ? currentSelection.filter(id => id !== userId)
        : [...currentSelection, userId];
      return {
        ...prev,
        recipientSelection: {
          ...prev.recipientSelection,
          custom: newSelection,
        },
      };
    });
  }, []);

  const currentStatus = statusConfig[emailServiceStatus];
  
  if (isLoading) {
      return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (view === 'composer') {
    return (
      <>
        <ComposerView
          composerState={composerState}
          setComposerState={setComposerState}
          setView={setView}
          userSearchTerm={userSearchTerm}
          setUserSearchTerm={setUserSearchTerm}
          filteredUsers={filteredUsers}
          handleCustomUserSelect={handleCustomUserSelect}
          setAiFormState={setAiFormState}
          setAiModalOpen={setAiModalOpen}
          handleSave={handleSave}
          isSaving={isSaving}
        />
        <Dialog open={isAiModalOpen} onOpenChange={setAiModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-headline flex items-center gap-2">
                <Wand2 /> AI Content Generator
              </DialogTitle>
              <DialogDescription>
                Provide some details and let AI craft your email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Email Type</Label>
                <Select
                  value={aiFormState.emailType}
                  onValueChange={value =>
                    setAiFormState(prev => ({ ...prev, emailType: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="invitation">Invitation</SelectItem>
                    <SelectItem value="congratulations">Congratulations</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tone</Label>
                <Select
                  value={aiFormState.tone}
                  onValueChange={value =>
                    setAiFormState(prev => ({ ...prev, tone: value as any }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Key Points / Topic</Label>
                <Textarea
                  placeholder="e.g., Announce the launch of our new History learning category."
                  value={aiFormState.topic}
                  onChange={e =>
                    setAiFormState(prev => ({ ...prev, topic: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Additional Instructions</Label>
                <Textarea
                  placeholder="e.g., Keep it concise, under 150 words."
                  value={aiFormState.additionalInstructions}
                  onChange={e =>
                    setAiFormState(prev => ({
                      ...prev,
                      additionalInstructions: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleGenerateWithAi}
                disabled={isGenerating || !aiFormState.topic}
              >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the campaign "{campaignToDelete?.subject}". This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCampaign}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <CampaignManagerView
      campaigns={campaigns}
      handleOpenCreate={handleOpenCreate}
      handleOpenEdit={handleOpenEdit}
      handleOpenDeleteDialog={handleOpenDeleteDialog}
      currentStatus={currentStatus}
    />
  );
}

    