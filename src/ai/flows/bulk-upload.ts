// src/ai/flows/bulk-upload.ts
'use server';

/**
 * @fileOverview A secure backend flow for processing CSV file uploads for bulk data creation.
 *
 * This flow simulates a secure HTTPS endpoint that parses a CSV file and performs
 * batch write operations to the database (Firestore). It's designed to be generic
 * for handling different types of data like users or questions.
 *
 * - bulkUpload - The main function to handle the upload process.
 * - BulkUploadInput - The input type for the bulkUpload function.
 * - BulkUploadOutput - The return type for the bulkUpload function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { User, Question } from '@/lib/data';

const BulkUploadInputSchema = z.object({
  dataType: z.enum(['users', 'questions']),
  csvData: z.string().describe('The full content of the CSV file as a string.'),
});
export type BulkUploadInput = z.infer<typeof BulkUploadInputSchema>;

const BulkUploadOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  importedCount: z.number().optional(),
  updatedData: z.array(z.custom<User | Question>()).optional(),
});
export type BulkUploadOutput = z.infer<typeof BulkUploadOutputSchema>;

// In a real app, this data would be in Firestore and modified by this flow.
let mockUserDatabase: User[] = [
  { id: 'usr_1', name: "Alice Johnson", email: "alice.j@example.com", phone: "123-456-7890", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d", status: "Active", lastLogin: "2024-07-20", score: 92, progress: 100, role: 'user' },
];
let mockQuestionDatabase: Question[] = [
  { id: "1", question: "What is the primary function of the mitochondria in a cell?", answer: "The primary function of mitochondria is to generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.", category: "Biology", remarks: "Key concept for cellular respiration." },
];

export async function bulkUpload(input: BulkUploadInput): Promise<BulkUploadOutput> {
  return bulkUploadFlow(input);
}

const bulkUploadFlow = ai.defineFlow(
  {
    name: 'bulkUploadFlow',
    inputSchema: BulkUploadInputSchema,
    outputSchema: BulkUploadOutputSchema,
  },
  async ({ dataType, csvData }) => {
    // Admin privileges would be checked here in a real application.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing delay

    try {
      const lines = csvData.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        return { success: false, message: 'CSV file must have a header and at least one data row.' };
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const newOrUpdatedItems: (User | Question)[] = [];

      for (const line of lines.slice(1)) {
        const data = line.split(',').map(d => d.trim().replace(/"/g, ''));
        const itemObj: any = {};
        headers.forEach((header, index) => {
          itemObj[header] = data[index] || '';
        });

        if (dataType === 'users') {
          const user: User = {
            id: itemObj.id || `usr_${Date.now()}_${Math.random()}`,
            name: itemObj.name,
            email: itemObj.email,
            phone: itemObj.phone || '',
            avatar: itemObj.avatar || `https://i.pravatar.cc/150?u=${itemObj.id || Math.random()}`,
            status: (itemObj.status as 'Active' | 'Inactive') || 'Active',
            lastLogin: itemObj.lastlogin || new Date().toISOString().split('T')[0],
            score: itemObj.score ? parseInt(itemObj.score) : 0,
            progress: itemObj.progress ? parseInt(itemObj.progress) : 0,
          };
          newOrUpdatedItems.push(user);
        } else if (dataType === 'questions') {
          const question: Question = {
            id: itemObj.id || `${Date.now()}_${Math.random()}`,
            category: itemObj.category || 'Uncategorized',
            question: itemObj.question || '',
            answer: itemObj.answer || '',
            remarks: itemObj.remarks || '',
          };
          newOrUpdatedItems.push(question);
        }
      }

      // Simulate updating the database
      if (dataType === 'users') {
        const usersMap = new Map(mockUserDatabase.map(u => [u.id, u]));
        (newOrUpdatedItems as User[]).forEach(u => usersMap.set(u.id, u));
        mockUserDatabase = Array.from(usersMap.values());
      } else {
        const questionsMap = new Map(mockQuestionDatabase.map(q => [q.id, q]));
        (newOrUpdatedItems as Question[]).forEach(q => questionsMap.set(q.id, q));
        mockQuestionDatabase = Array.from(questionsMap.values());
      }

      return {
        success: true,
        message: `Successfully imported ${newOrUpdatedItems.length} ${dataType}.`,
        importedCount: newOrUpdatedItems.length,
        updatedData: dataType === 'users' ? mockUserDatabase : mockQuestionDatabase,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `An error occurred during CSV processing: ${error.message}`,
      };
    }
  }
);
