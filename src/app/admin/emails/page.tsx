import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, PlusCircle, Wand2 } from 'lucide-react';

export default function EmailsPage() {
  return (
    <Card>
      <CardHeader>
         <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <Mail />
              Email Campaigns
            </CardTitle>
            <CardDescription>
              Generate and send email updates, notifications, and invitations.
            </CardDescription>
          </div>
          <Button>
            <Wand2 className="mr-2 h-4 w-4" />
            Generate with AI
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-lg">
            <h3 className="text-lg font-semibold text-muted-foreground">No Campaigns Yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Start by generating a new campaign with our AI assistant.</p>
            <Button variant="outline" className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Campaign
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
