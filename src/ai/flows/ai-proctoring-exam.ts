'use server';

/**
 * @fileOverview AI-proctored exam flow that assesses user answers for intent.
 *
 * - aiProctoringExam - A function that handles the exam process.
 * - AiProctoringExamInput - The input type for the aiProctoringExam function.
 * - AiProctoringExamOutput - The return type for the aiProctoringExam function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiProctoringExamInputSchema = z.object({
  question: z.string().describe('The question being asked.'),
  userAnswer: z.string().describe('The user\'s answer to the question.'),
  expectedAnswer: z.string().describe('The expected answer to the question.'),
});
export type AiProctoringExamInput = z.infer<typeof AiProctoringExamInputSchema>;

const AiProctoringExamOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user\'s answer is correct based on intent.'),
  feedback: z.string().describe('Feedback on the user\'s answer.'),
});
export type AiProctoringExamOutput = z.infer<typeof AiProctoringExamOutputSchema>;

export async function aiProctoringExam(input: AiProctoringExamInput): Promise<AiProctoringExamOutput> {
  return aiProctoringExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProctoringExamPrompt',
  input: {schema: AiProctoringExamInputSchema},
  output: {schema: AiProctoringExamOutputSchema},
  prompt: `You are an AI exam proctor. Your task is to determine if a student's answer to a question is correct, even if it doesn't match the expected answer exactly. Focus on the intent and meaning of the answer. Provide feedback to the student.

Question: {{{question}}}
User's Answer: {{{userAnswer}}}
Expected Answer: {{{expectedAnswer}}}

Assess if the user's answer demonstrates understanding of the material, and provide constructive feedback.  The outputted JSON must be valid and parsable. Be concise in your feedback.
`,
});

const aiProctoringExamFlow = ai.defineFlow(
  {
    name: 'aiProctoringExamFlow',
    inputSchema: AiProctoringExamInputSchema,
    outputSchema: AiProctoringExamOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
