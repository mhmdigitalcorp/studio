'use server';

/**
 * @fileOverview Implements the adaptive learning feedback flow for AI-proctored exams.
 *
 * This flow provides immediate feedback on user answers and repeats questions until
 * the user answers correctly, reinforcing understanding and promoting mastery.
 *
 * @exports {
 *   adaptiveLearningFeedback,
 *   AdaptiveLearningFeedbackInput,
 *   AdaptiveLearningFeedbackOutput,
 * }
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema
const AdaptiveLearningFeedbackInputSchema = z.object({
  question: z.string().describe('The question being asked.'),
  userAnswer: z.string().describe('The user\'s answer to the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});
export type AdaptiveLearningFeedbackInput = z.infer<typeof AdaptiveLearningFeedbackInputSchema>;

// Define the output schema
const AdaptiveLearningFeedbackOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user answered correctly.'),
  feedback: z.string().describe('Feedback on the user\'s answer.'),
});
export type AdaptiveLearningFeedbackOutput = z.infer<typeof AdaptiveLearningFeedbackOutputSchema>;

// Exported function to call the flow
export async function adaptiveLearningFeedback(input: AdaptiveLearningFeedbackInput): Promise<AdaptiveLearningFeedbackOutput> {
  return adaptiveLearningFeedbackFlow(input);
}

// Define the prompt
const adaptiveLearningFeedbackPrompt = ai.definePrompt({
  name: 'adaptiveLearningFeedbackPrompt',
  input: {schema: AdaptiveLearningFeedbackInputSchema},
  output: {schema: AdaptiveLearningFeedbackOutputSchema},
  prompt: `You are an AI-powered exam proctor providing feedback to a student.

  Determine if the student's answer is correct based on the intent, not just keywords.
  Provide constructive feedback to help the student understand the correct answer.
  If the answer is incorrect, explain why and provide hints.

  Question: {{{question}}}
  User's Answer: {{{userAnswer}}}
  Correct Answer: {{{correctAnswer}}}

  Respond with whether the answer is correct and the feedback.
  Ensure that the isCorrect boolean field is set to true if the user answers correctly.
  `,
});

// Define the flow
const adaptiveLearningFeedbackFlow = ai.defineFlow(
  {
    name: 'adaptiveLearningFeedbackFlow',
    inputSchema: AdaptiveLearningFeedbackInputSchema,
    outputSchema: AdaptiveLearningFeedbackOutputSchema,
  },
  async input => {
    const {output} = await adaptiveLearningFeedbackPrompt(input);
    return output!;
  }
);
