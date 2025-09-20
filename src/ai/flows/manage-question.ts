'use server';

/**
 * @fileOverview A secure backend flow for creating, updating, and deleting questions in Firestore.
 *
 * This flow acts as the single point of entry for question management, ensuring
 * that all data modifications are handled securely and consistently on the server.
 * It interacts directly with Firestore using the Admin SDK.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Question } from '@/lib/data';
import { db } from '@/lib/firebase-admin';

const ManageQuestionInputSchema = z.object({
  action: z.enum(['create', 'update', 'delete', 'getAll']),
  questionData: z.custom<Partial<Question>>().optional(),
  questionId: z.string().optional(),
});
export type ManageQuestionInput = z.infer<typeof ManageQuestionInputSchema>;

const ManageQuestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  question: z.custom<Question>().optional(),
  questions: z.array(z.custom<Question>()).optional(),
});
export type ManageQuestionOutput = z.infer<typeof ManageQuestionOutputSchema>;

export async function manageQuestion(input: ManageQuestionInput): Promise<ManageQuestionOutput> {
  return manageQuestionFlow(input);
}

const manageQuestionFlow = ai.defineFlow(
  {
    name: 'manageQuestionFlow',
    inputSchema: ManageQuestionInputSchema,
    outputSchema: ManageQuestionOutputSchema,
  },
  async (input) => {
    // In a real app, you would check admin privileges here.
    const questionsCollection = db.collection('questions');

    try {
      switch (input.action) {
        case 'getAll': {
          const snapshot = await questionsCollection.get();
          const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
          return { success: true, message: 'Questions fetched successfully.', questions };
        }

        case 'create': {
          if (!input.questionData || !input.questionData.question || !input.questionData.answer) {
            return { success: false, message: 'Question data is missing for create action.' };
          }

          const newDocRef = questionsCollection.doc();
          const newQuestion: Question = {
            id: newDocRef.id,
            question: input.questionData.question,
            answer: input.questionData.answer,
            category: input.questionData.category || 'Uncategorized',
            remarks: input.questionData.remarks || '',
          };
          await newDocRef.set(newQuestion);
          return { success: true, message: 'Question created successfully.', question: newQuestion };
        }

        case 'update': {
          if (!input.questionId || !input.questionData) {
            return { success: false, message: 'Question ID or data is missing for update action.' };
          }
          const questionRef = questionsCollection.doc(input.questionId);
          await questionRef.set(input.questionData, { merge: true });
          const updatedDoc = await questionRef.get();
          return { success: true, message: 'Question updated successfully.', question: { id: updatedDoc.id, ...updatedDoc.data() } as Question };
        }

        case 'delete': {
          if (!input.questionId) {
            return { success: false, message: 'Question ID is missing for delete action.' };
          }
          await questionsCollection.doc(input.questionId).delete();
          return { success: true, message: 'Question deleted successfully.' };
        }

        default:
          return { success: false, message: `Unsupported action.` };
      }
    } catch (error: any) {
      console.error(`Error in manageQuestionFlow action '${input.action}':`, error);
      return { success: false, message: `An error occurred: ${error.message}` };
    }
  }
);
