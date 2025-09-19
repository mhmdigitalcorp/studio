export type Campaign = {
  id: string;
  subject: string;
  status: 'Sent' | 'Draft' | 'Scheduled';
  recipients: number;
  date: string;
};

export const campaigns: Campaign[] = [
  {
    id: 'camp_1',
    subject: 'New Feature: Voice-Activated Lessons!',
    status: 'Sent',
    recipients: 1257,
    date: '2024-07-20',
  },
  {
    id: 'camp_2',
    subject: 'Mid-Week Learning Reminder',
    status: 'Scheduled',
    recipients: 834,
    date: '2024-07-25',
  },
  {
    id: 'camp_3',
    subject: 'Q3 Curriculum Update (Draft)',
    status: 'Draft',
    recipients: 0,
    date: 'N/A',
  },
   {
    id: 'camp_4',
    subject: 'Congratulations on Your High Score!',
    status: 'Sent',
    recipients: 56,
    date: '2024-07-18',
  },
];
