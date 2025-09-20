// src/ai/flows/bulk-upload.ts
'use server';

/**
 * @fileOverview A secure backend flow for processing CSV file uploads for bulk data creation in Firestore.
 *
 * This flow parses a CSV file and performs batch write operations to the database (Firestore).
 * It's designed to be generic for handling different types of data like users or questions.
 *
 * - bulkUpload - The main function to handle the upload process.
 * - BulkUploadInput - The input type for the bulkUpload function.
 * - BulkUploadOutput - The return type for the bulkUpload function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { User, Question } from '@/lib/data';
import { db } from '@/lib/firebase-admin'; // Using admin SDK
import { collection, writeBatch, getDocs, doc } from 'firebase/firestore';


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
    
    try {
      const lines = csvData.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        return { success: false, message: 'CSV file must have a header and at least one data row.' };
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      const batch = writeBatch(db);
      const collectionName = dataType; // 'users' or 'questions'
      const collectionRef = collection(db, collectionName);
      let itemsAdded = 0;

      for (const line of lines.slice(1)) {
        const data = line.split(',').map(d => d.trim().replace(/"/g, ''));
        const itemObj: any = {};
        headers.forEach((header, index) => {
          itemObj[header] = data[index] || '';
        });

        // Use a provided ID or generate a new one
        const docId = itemObj.id || doc(collectionRef).id;
        const docRef = doc(db, collectionName, docId);
        
        if (dataType === 'users') {
          const user: Omit<User, 'id'> = {
            name: itemObj.name,
            email: itemObj.email,
            phone: itemObj.phone || '',
            avatar: itemObj.avatar || `https://i.pravatar.cc/150?u=${docId}`,
            status: (itemObj.status as 'Active' | 'Inactive') || 'Active',
            lastLogin: itemObj.lastlogin || new Date().toISOString().split('T')[0],
            score: itemObj.score ? parseInt(itemObj.score) : 0,
            progress: itemObj.progress ? parseInt(itemObj.progress) : 0,
            role: 'user',
          };
          batch.set(docRef, user);
        } else if (dataType === 'questions') {
          const question: Omit<Question, 'id'> = {
            category: itemObj.category || 'Uncategorized',
            question: itemObj.question || '',
            answer: itemObj.answer || '',
            remarks: itemObj.remarks || '',
          };
           batch.set(docRef, question);
        }
        itemsAdded++;
      }

      await batch.commit();

      // Fetch the updated collection to return to the client
      const snapshot = await getDocs(collectionRef);
      const updatedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        success: true,
        message: `Successfully imported ${itemsAdded} ${dataType}.`,
        importedCount: itemsAdded,
        updatedData: updatedData as (User[] | Question[]),
      };
    } catch (error: any) {
      console.error(`Error in bulkUploadFlow for ${dataType}:`, error);
      return {
        success: false,
        message: `An error occurred during CSV processing: ${error.message}`,
      };
    }
  }
);
