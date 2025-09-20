// src/ai/flows/manage-user.ts
'use server';

/**
 * @fileOverview A secure backend flow for creating, updating, and deleting users.
 *
 * This flow acts as the single point of entry for user management, ensuring
 * that all user data modifications are handled securely and consistently on the server.
 * It simulates a callable HTTPS function.
 *
 * - manageUser - The main function to handle user data operations.
 * - ManageUserInput - The input type for the manageUser function.
 * - ManageUserOutput - The return type for the manageUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { User } from '@/lib/data';

const ManageUserInputSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'bulkDelete']),
  userData: z.custom<Partial<User>>().optional(),
  userId: z.string().optional(),
  userIds: z.array(z.string()).optional(), // For bulk deletion
});
export type ManageUserInput = z.infer<typeof ManageUserInputSchema>;

const ManageUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.custom<User>().optional(),
  users: z.array(z.custom<User>()).optional(),
});
export type ManageUserOutput = z.infer<typeof ManageUserOutputSchema>;

// Mock database simulation
let mockUserDatabase: User[] = [
  { id: 'usr_1', name: "Alice Johnson", email: "alice.j@example.com", phone: "123-456-7890", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d", status: "Active", lastLogin: "2024-07-20", score: 92, progress: 100, role: 'user' },
  { id: 'usr_2', name: "Bob Williams", email: "bob.w@example.com", phone: "234-567-8901", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d", status: "Active", lastLogin: "2024-07-21", score: 88, progress: 75, role: 'user' },
  { id: 'usr_3', name: "Charlie Brown", email: "charlie.b@example.com", phone: "345-678-9012", avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d", status: "Inactive", lastLogin: "2024-06-15", score: 76, progress: 50, role: 'user' },
  { id: 'usr_4', name: "Diana Miller", email: "diana.m@example.com", phone: "456-789-0123", avatar: "https://i.pravatar.cc/150?u=a048581f4e29026701d", status: "Active", lastLogin: "2024-07-22", score: 95, progress: 100, role: 'user' },
  { id: 'usr_5', name: "Ethan Davis", email: "ethan.d@example.com", phone: "567-890-1234", avatar: "https://i.pravatar.cc/150?u=a092581f4e29026705d", status: "Inactive", lastLogin: "2024-05-30", score: 65, progress: 30, role: 'user' },
];


export async function manageUser(input: ManageUserInput): Promise<ManageUserOutput> {
  return manageUserFlow(input);
}

const manageUserFlow = ai.defineFlow(
  {
    name: 'manageUserFlow',
    inputSchema: ManageUserInputSchema,
    outputSchema: ManageUserOutputSchema,
  },
  async (input) => {
    // In a real app, this would use the Firebase Admin SDK to interact with Auth and Firestore.
    // We will simulate these interactions with a mock database.
    // Admin privileges would be checked here using `context.auth`.

    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency

    switch (input.action) {
      case 'create': {
        if (!input.userData || !input.userData.email) {
          return { success: false, message: 'User data or email is missing for create action.' };
        }
        const newId = `usr_${Date.now()}`;
        const newUser: User = {
          id: newId,
          name: input.userData.name || 'New User',
          email: input.userData.email,
          phone: input.userData.phone || '',
          password: input.userData.password,
          avatar: `https://i.pravatar.cc/150?u=${newId}`,
          status: input.userData.status || 'Active',
          lastLogin: new Date().toISOString().split('T')[0],
          score: 0,
          progress: 0,
          role: 'user',
        };
        mockUserDatabase.push(newUser);
        return { success: true, message: 'User created successfully.', user: newUser };
      }

      case 'delete': {
        if (!input.userId) {
          return { success: false, message: 'User ID is missing for delete action.' };
        }
        mockUserDatabase = mockUserDatabase.filter(u => u.id !== input.userId);
        return { success: true, message: 'User deleted successfully.' };
      }
      
      case 'bulkDelete': {
        if (!input.userIds) {
            return { success: false, message: 'User IDs are missing for bulk delete action.' };
        }
        mockUserDatabase = mockUserDatabase.filter(u => !input.userIds!.includes(u.id));
        return { success: true, message: `${input.userIds.length} users deleted successfully.` };
      }

      default:
        return { success: false, message: `Unsupported action: ${input.action}` };
    }
  }
);
