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
import { Mail, Wand2, Send, Loader2 } from 'lucide-react';
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

export default function EmailsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formState, setFormState] = useState<GenerateEmailCampaignInput>({
    campaignType: 'notification',
    topic: '',
    targetAudience: '',
    desiredTone: '',
  });
  const [emailContent, setEmailContent] = useState<GenerateEmailCampaignOutput>({
    subject: '',
    body: '',
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setEmailContent({ subject: '', body: '' });
    try {
      const result = await generateEmailCampaign(formState);
      setEmailContent(result);
    } catch (error) {
      console.error('Failed to generate email campaign:', error);
      // You could show a toast notification here
    }
    setIsGenerating(false);
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Wand2 />
              AI Campaign Generator
            </CardTitle>
            <CardDescription>
              Define your campaign and let AI create the content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="campaignType">Campaign Type</Label>
              <Select
                name="campaignType"
                value={formState.campaignType}
                onValueChange={(value) =>
                  handleSelectChange('campaignType', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="invitation">Invitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                name="topic"
                placeholder="e.g., New Feature Launch"
                value={formState.topic}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                name="targetAudience"
                placeholder="e.g., All active users"
                value={formState.targetAudience}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desiredTone">Desired Tone</Label>
              <Input
                id="desiredTone"
                name="desiredTone"
                placeholder="e.g., Friendly and exciting"
                value={formState.desiredTone}
                onChange={handleInputChange}
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !formState.topic}
              className="w-full"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate with AI
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl flex items-center gap-2">
                  <Mail />
                  Campaign Preview
                </CardTitle>
                <CardDescription>
                  Review and edit the generated email before sending.
                </CardDescription>
              </div>
              <Button disabled={isGenerating || !emailContent.subject}>
                <Send className="mr-2 h-4 w-4" />
                Send Campaign
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-lg min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <h3 className="text-lg font-semibold text-muted-foreground mt-4">Generating Content...</h3>
                <p className="text-sm text-muted-foreground mt-1">Our AI is crafting the perfect email for you.</p>
              </div>
            ) : emailContent.subject || emailContent.body ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={emailContent.subject}
                    onChange={(e) => setEmailContent({...emailContent, subject: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="body">Body</Label>
                  <Textarea
                    id="body"
                    value={emailContent.body}
                    onChange={(e) => setEmailContent({...emailContent, body: e.target.value})}
                    rows={12}
                    className="h-auto"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-lg min-h-[400px]">
                <h3 className="text-lg font-semibold text-muted-foreground">No Content Generated Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Fill out the form on the left and click "Generate with AI" to
                  start.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
