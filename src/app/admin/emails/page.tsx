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
  DialogDescription
} from '@/components/ui/dialog';
import { campaigns as initialCampaigns, Campaign } from '@/lib/email-data';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ViewMode = 'manager' | 'composer';

export default function EmailsPage() {
  const [view, setView] = useState<ViewMode>('manager');
  const [campaigns] = useState<Campaign[]>(initialCampaigns);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [aiFormState, setAiFormState] = useState<Omit<GenerateEmailCampaignInput, 'targetAudience'>>({
    emailType: 'newsletter',
    tone: 'friendly',
    topic: '',
  });

  const [composerState, setComposerState] = useState({
    recipients: 'all',
    subject: '',
    body: '',
    sendNow: true,
  });

  const handleGenerateWithAi = async () => {
    setIsGenerating(true);
    try {
      const result = await generateEmailCampaign({ ...aiFormState, targetAudience: composerState.recipients });
      setComposerState(prev => ({ ...prev, subject: result.subject, body: result.body }));
      setAiModalOpen(false);
    } catch (error) {
      console.error('Failed to generate email campaign:', error);
      // You could show a toast notification here
    }
    setIsGenerating(false);
  };

  const CampaignManagerView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Mail />
              Email Campaigns
            </CardTitle>
            <CardDescription>
              View, manage, and create your email campaigns.
            </CardDescription>
          </div>
          <Button onClick={() => setView('composer')}>
            <PlusCircle />
            Create New Campaign
          </Button>
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
            {campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.subject}</TableCell>
                <TableCell>
                   <Badge variant={
                      campaign.status === 'Sent' ? 'default' :
                      campaign.status === 'Draft' ? 'secondary' : 'outline'
                    }>
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell>{campaign.recipients}</TableCell>
                <TableCell>{campaign.date}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const ComposerView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setView('manager')}>
          <ArrowLeft />
        </Button>
        <h2 className="font-headline text-2xl">Create New Campaign</h2>
      </div>

      {/* Recipient Segmentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            Recipient Segmentation
          </CardTitle>
          <CardDescription>Choose who this email will be sent to.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={composerState.recipients} onValueChange={value => setComposerState(prev => ({...prev, recipients: value}))}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user segment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="not-started">Users who haven't started learning</SelectItem>
              <SelectItem value="completed-exam">Users with completed exams</SelectItem>
              <SelectItem value="score-gt-80">Users with exam score > 80%</SelectItem>
              <SelectItem value="custom" disabled>Custom List (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Email Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText />
                Email Content
              </CardTitle>
              <CardDescription>Write your email manually or generate it with AI.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => {
              setAiFormState({ emailType: 'newsletter', tone: 'friendly', topic: '' });
              setAiModalOpen(true);
            }}>
              <Wand2 />
              Generate with AI
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input id="subject" placeholder="Your campaign subject" value={composerState.subject} onChange={e => setComposerState(prev => ({...prev, subject: e.target.value}))} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Content Body</Label>
            <Textarea id="body" rows={15} placeholder="Write your email here..." value={composerState.body} onChange={e => setComposerState(prev => ({...prev, body: e.target.value}))} />
          </div>
        </CardContent>
      </Card>
      
      {/* Scheduling & Sending */}
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
              <Switch id="send-now" checked={composerState.sendNow} onCheckedChange={checked => setComposerState(prev => ({...prev, sendNow: checked}))} />
              <Label htmlFor="send-now">{composerState.sendNow ? 'Send Immediately' : 'Schedule for Later'}</Label>
            </div>
            {!composerState.sendNow && (
              <Input type="datetime-local" disabled placeholder="Select a date and time" />
            )}
        </CardContent>
         <CardContent className="flex justify-end gap-2">
            <Button variant="outline">Save Draft</Button>
            {composerState.sendNow ? (
                 <Button><Send className="mr-2 h-4 w-4" /> Send Now</Button>
            ) : (
                <Button disabled><Calendar className="mr-2 h-4 w-4" /> Schedule</Button>
            )}
        </CardContent>
      </Card>

      {/* AI Generation Modal */}
       <Dialog open={isAiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2"><Wand2/> AI Content Generator</DialogTitle>
            <DialogDescription>Provide some details and let AI craft your email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Email Type</Label>
              <Select value={aiFormState.emailType} onValueChange={value => setAiFormState(prev => ({...prev, emailType: value as any}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
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
              <Select value={aiFormState.tone} onValueChange={value => setAiFormState(prev => ({...prev, tone: value as any}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
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
              <Textarea placeholder="e.g., Announce the launch of our new History learning category." value={aiFormState.topic} onChange={e => setAiFormState(prev => ({...prev, topic: e.target.value}))}/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleGenerateWithAi} disabled={isGenerating || !aiFormState.topic}>
              {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  return view === 'manager' ? <CampaignManagerView /> : <ComposerView />;
}
