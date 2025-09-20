'use server';
/**
 * @fileOverview A flow to test the configured AI service API key.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TestAiServiceInputSchema = z.object({
  apiKey: z.string().describe('The AI API key to test.'),
});
export type TestAiServiceInput = z.infer<typeof TestAiServiceInputSchema>;

const TestAiServiceOutputSchema = z.object({
  success: z.boolean().describe('Whether the test was successful.'),
  message: z.string().describe('A message indicating the result of the test.'),
});
export type TestAiServiceOutput = z.infer<typeof TestAiServiceOutputSchema>;


export async function testAiService(input: TestAiServiceInput): Promise<TestAiServiceOutput> {
  return testAiServiceFlow(input);
}

const testAiServiceFlow = ai.defineFlow(
  {
    name: 'testAiServiceFlow',
    inputSchema: TestAiServiceInputSchema,
    outputSchema: TestAiServiceOutputSchema,
  },
  async (input) => {
    // In a real application, you would make a lightweight call to the AI provider
    // to validate the key. For this example, we will simulate the process.
    
    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!input.apiKey || input.apiKey.length < 10) {
       return {
        success: false,
        message: 'The provided API key appears to be invalid or is too short.',
      };
    }

    // Simulate success
    return {
      success: true,
      message: 'AI service is operational. Connection successful.',
    };
  }
);
