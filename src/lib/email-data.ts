export type Campaign = {
  id: string;
  subject: string;
  body: string;
  status: 'Sent' | 'Draft' | 'Scheduled';
  recipients: string; // "all", "not-started", etc.
  date: string; // ISO string for sent/scheduled date, or N/A
  analytics?: {
    recipients: number;
    openRate: number;
    clickRate: number;
  };
};

export const campaigns: Campaign[] = [
  {
    id: 'camp_1',
    subject: 'New Feature: Voice-Activated Lessons!',
    body: '## Discover a new way to learn!\n\nWe are excited to announce our latest feature: voice-activated lessons. You can now learn on the go, completely hands-free. Try it out today!',
    status: 'Sent',
    recipients: 'all',
    date: '2024-07-20T10:00:00.000Z',
    analytics: {
      recipients: 1257,
      openRate: 45,
      clickRate: 12,
    }
  },
  {
    id: 'camp_2',
    subject: 'Mid-Week Learning Reminder',
    body: '### Keep the momentum going!\n\nJust a friendly reminder to continue your learning journey. A few minutes a day can make a big difference. Log in now and pick up where you left off.',
    status: 'Scheduled',
    recipients: 'not-started',
    date: '2024-08-01T10:00:00.000Z', 
  },
  {
    id: 'camp_3',
    subject: 'Q3 Curriculum Update',
    body: '',
    status: 'Draft',
    recipients: 'all',
    date: 'N/A',
  },
   {
    id: 'camp_4',
    subject: 'Congratulations on Your High Score!',
    body: '### Amazing work!\n\nYou recently scored over 80% on an exam. Keep up the excellent effort!',
    status: 'Sent',
    recipients: 'score-gt-80',
    date: '2024-07-18T15:30:00.000Z',
    analytics: {
      recipients: 56,
      openRate: 78,
      clickRate: 25,
    }
  },
];
