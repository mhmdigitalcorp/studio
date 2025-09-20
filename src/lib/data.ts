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

// NOTE: Static data is now deprecated and will be fetched from the backend.
// This file is retained for type definitions only.

export const questions: Question[] = [];
export const users: User[] = [];
export const todos: Todo[] = [];
export const campaigns: Campaign[] = [];
