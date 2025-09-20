'use server';
/**
 * @fileOverview A flow to test the configured email service.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendEmail } from '@/services/email-service';
import { db } from '@/lib/firebase-admin';

const TestEmailServiceInputSchema = z.object({
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
  async ({ recipient }) => {
    try {
      const settingsDoc = await db.collection('settings').doc('app-config').get();
      if (!settingsDoc.exists) {
        return { success: false, message: 'Email service not configured.' };
      }
      const settings = settingsDoc.data();
      
      if (!settings?.provider || settings.provider === 'none') {
        return { success: false, message: 'No email provider selected.' };
      }
      
      await sendEmail({
        to: recipient,
        from: settings.fromEmail,
        subject: 'LearnFlow Email Service Test',
        text: 'This is a test email from LearnFlow. Your email service is configured correctly.',
        html: '<p>This is a test email from LearnFlow. Your email service is configured correctly.</p>',
      });

      return {
        success: true,
        message: `Test email successfully sent to ${recipient}.`,
      };
    } catch (error: any) {
      console.error('Error in testEmailServiceFlow:', error);
      return {
        success: false,
        message: `Failed to send test email: ${error.message}`,
      };
    }
  }
);
