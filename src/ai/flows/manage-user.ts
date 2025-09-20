// src/ai/flows/manage-user.ts
'use server';

/**
 * @fileOverview A secure backend flow for creating, updating, and deleting users in Firestore.
 *
 * This flow acts as the single point of entry for user management, ensuring
 * that all user data modifications are handled securely and consistently on the server.
 * It interacts directly with Firestore using the Admin SDK.
 *
 * - manageUser - The main function to handle user data operations.
 * - ManageUserInput - The input type for the manageUser function.
 * - ManageUserOutput - The return type for the manageUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { User } from '@/lib/data';
import { db } from '@/lib/firebase-admin'; // Using admin SDK


const ManageUserInputSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'bulkDelete', 'getAll']),
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
    // In a real app, you would check admin privileges here for certain actions.
    const usersCollection = db.collection('users');

    try {
        switch (input.action) {
          case 'getAll': {
             const snapshot = await usersCollection.get();
             const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
             return { success: true, message: 'Users fetched successfully.', users };
          }
            
          case 'create': {
            if (!input.userData || !input.userData.email || !input.userData.name) {
              return { success: false, message: 'User data, email, or name is missing for create action.' };
            }
            
            // Use the provided userId (from Auth) or generate a new one for admin creation.
            const newId = input.userId || `usr_${Date.now()}`;
            
            const newUser: User = {
              id: newId,
              name: input.userData.name,
              email: input.userData.email,
              phone: input.userData.phone || '',
              avatar: input.userData.avatar || `https://i.pravatar.cc/150?u=${newId}`,
              status: input.userData.status || 'Active',
              lastLogin: new Date().toISOString().split('T')[0],
              score: 0,
              progress: 0,
              role: input.userData.role || 'user',
            };
            await usersCollection.doc(newId).set(newUser);
            return { success: true, message: 'User created successfully.', user: newUser };
          }

          case 'update': {
            if (!input.userId || !input.userData) {
              return { success: false, message: 'User ID or data is missing for update action.' };
            }
             const userRef = usersCollection.doc(input.userId);
             await userRef.set(input.userData, { merge: true });
             const updatedDoc = await userRef.get();
             return { success: true, message: 'User updated successfully.', user: { id: updatedDoc.id, ...updatedDoc.data() } as User };
          }
    
          case 'delete': {
            if (!input.userId) {
              return { success: false, message: 'User ID is missing for delete action.' };
            }
            await usersCollection.doc(input.userId).delete();
            return { success: true, message: 'User deleted successfully.' };
          }
          
          case 'bulkDelete': {
            if (!input.userIds || input.userIds.length === 0) {
                return { success: false, message: 'User IDs are missing for bulk delete action.' };
            }
            const batch = db.batch();
            input.userIds.forEach(id => {
                batch.delete(usersCollection.doc(id));
            });
            await batch.commit();

            const snapshot = await usersCollection.get();
            const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            return { success: true, message: `${input.userIds.length} users deleted successfully.`, users };
          }
    
          default:
            return { success: false, message: `Unsupported action: ${input.action}` };
        }
    } catch (error: any) {
         console.error(`Error in manageUserFlow action '${input.action}':`, error);
         return { success: false, message: `An error occurred: ${error.message}` };
    }
  }
);
