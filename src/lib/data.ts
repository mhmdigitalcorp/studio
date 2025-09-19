export type Question = {
  id: number;
  question: string;
  answer: string;
  category: string;
};

export const questions: Question[] = [
  { id: 1, question: "What is the primary function of the mitochondria in a cell?", answer: "The primary function of mitochondria is to generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.", category: "Biology" },
  { id: 2, question: "Who wrote 'To Kill a Mockingbird'?", answer: "Harper Lee wrote 'To Kill a Mockingbird'.", category: "Literature" },
  { id: 3, question: "What is the formula for calculating the area of a circle?", answer: "The formula for the area of a circle is A = πr², where r is the radius of the circle.", category: "Mathematics" },
  { id: 4, question: "What year did the first human land on the moon?", answer: "The first human landed on the moon in 1969.", category: "History" },
  { id: 5, question: "What is the capital of Japan?", answer: "The capital of Japan is Tokyo.", category: "Geography" },
  { id: 6, question: "In programming, what does API stand for?", answer: "API stands for Application Programming Interface.", category: "Technology" },
  { id: 7, question: "What chemical element is represented by the symbol 'Au'?", answer: "The chemical element represented by 'Au' is gold.", category: "Science" },
  { id: 8, question: "Who painted the Mona Lisa?", answer: "Leonardo da Vinci painted the Mona Lisa.", category: "Art" },
  { id: 9, question: "What is the main component of Earth's atmosphere?", answer: "The main component of Earth's atmosphere is Nitrogen, making up about 78%.", category: "Science" },
  { id: 10, question: "What is the difference between 'let' and 'const' in JavaScript?", answer: "'let' allows you to declare variables that can be reassigned, while 'const' declares variables that cannot be reassigned after their initial value is set.", category: "Technology" },
];

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  lastLogin: string;
  score: number;
  progress: number;
};

export const users: User[] = [
  { id: 'usr_1', name: "Alice Johnson", email: "alice.j@example.com", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d", status: "Active", lastLogin: "2024-07-20", score: 92, progress: 100 },
  { id: 'usr_2', name: "Bob Williams", email: "bob.w@example.com", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", status: "Active", lastLogin: "2024-07-21", score: 88, progress: 75 },
  { id: 'usr_3', name: "Charlie Brown", email: "charlie.b@example.com", avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d", status: "Inactive", lastLogin: "2024-06-15", score: 76, progress: 50 },
  { id: 'usr_4', name: "Diana Miller", email: "diana.m@example.com", avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d", status: "Active", lastLogin: "2024-07-22", score: 95, progress: 100 },
  { id: 'usr_5', name: "Ethan Davis", email: "ethan.d@example.com", avatar: "https://i.pravatar.cc/150?u=a092581f4e29026705d", status: "Inactive", lastLogin: "2024-05-30", score: 65, progress: 30 },
];

export type Todo = {
  id: number;
  task: string;
  completed: boolean;
};

export const todos: Todo[] = [
  { id: 1, task: "Finalize Q3 curriculum questions", completed: false },
  { id: 2, task: "Schedule user feedback session for the new exam module", completed: false },
  { id: 3, task: "Update API keys for the email service", completed: true },
  { id: 4, task: "Draft announcement for the new voice lesson feature", completed: false },
  { id: 5, task: "Review bulk user import error logs", completed: false },
];
