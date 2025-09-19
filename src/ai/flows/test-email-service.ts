'use server';
/**
 * @fileOverview A flow to test the configured email service.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TestEmailServiceInputSchema = z.object({
  service: z.string().describe('The email service to test.'),
  recipient: z.string().email().describe('The email address to send a test to.'),
});

export type TestEmailServiceInput = z.infer<typeof TestEmailServiceInputSchema>;

const TestEmailServiceOutputSchema = z.object({
  success: z.boolean().describe('Whether the test was successful.'),
  message: z.string().describe('A message indicating the result of the test.'),
});

export type TestEmailServiceOutput = z.infer<typeof TestEmailServiceOutputSchema>;


export async function testEmailService(input: TestEmailServiceInput): Promise<TestEmailServiceOutput> {
  return testEmailServiceFlow(input);
}

const testEmailServiceFlow = ai.defineFlow(
  {
    name: 'testEmailServiceFlow',
    inputSchema: TestEmailServiceInputSchema,
    outputSchema: TestEmailServiceOutputSchema,
  },
  async (input) => {
    // In a real application, you would retrieve the secure API key for the service
    // and use a library like Nodemailer or a provider's SDK to send an email.
    // For this example, we will simulate the process.

    console.log(`Simulating test email to ${input.recipient} via ${input.service}`);

    // Simulate a network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate a failure for a specific service for demonstration purposes
    if (input.service === 'gmail') {
       return {
        success: false,
        message: 'Gmail provider is not supported for automated testing in this demo.',
      };
    }

    // Simulate success
    return {
      success: true,
      message: `Test email successfully sent to admin@learnflow.app via ${input.service}.`,
    };
  }
);
