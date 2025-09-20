export type Question = {
  id: string;
  question: string;
  answer: string;
  category: string;
  remarks?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  score: number;
  progress: number;
  password?: string;
  role?: 'user' | 'admin';
};

export type Todo = {
  id: number;
  task: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low' | 'info';
  dueDate: string; // ISO string
  category: string;
  subtasks: { id: number; text: string; completed: boolean }[];
};

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

export const todos: Todo[] = [
    { id: 1, task: "Finalize Q3 curriculum proposal", completed: false, priority: "high", dueDate: new Date().toISOString(), category: "Planning", subtasks: [] },
    { id: 2, task: "Review user feedback from last week's survey", completed: false, priority: "medium", dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), category: "Administration", subtasks: [] },
    { id: 3, task: "Draft newsletter for new feature launch", completed: true, priority: "medium", dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), category: "Communication", subtasks: [] },
    { id: 4, task: "Add 10 new questions to the Biology category", completed: false, priority: "low", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), category: "Content", subtasks: [] },
    { id: 5, task: "Debug user login issue reported on mobile", completed: false, priority: "high", dueDate: new Date(Date.now() - 2 * 24 * 60