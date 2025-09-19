// src/ai/flows/generate-email-campaigns.ts
'use server';

/**
 * @fileOverview AI-assisted email campaign generator for admin communication.
 *
 * - generateEmailCampaign - A function that generates email content for campaigns.
 * - GenerateEmailCampaignInput - The input type for the generateEmailCampaign function.
 * - GenerateEmailCampaignOutput - The return type for the generateEmailCampaign function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateEmailCampaignInputSchema = z.object({
  emailType: z
    .enum(['newsletter', 'update', 'notification', 'invitation', 'congratulations', 'reminder'])
    .describe('The type of email campaign to generate.'),
  tone: z
    .enum(['formal', 'friendly', 'urgent', 'encouraging'])
    .describe('The desired tone of the email (e.g., formal, friendly, urgent).'),
  topic: z.string().describe('The key points or topic of the email campaign.'),
  targetAudience: z.string().optional().describe('The target audience for the email.'),
  additionalInstructions: z
    .string()
    .optional()
    .describe('Any additional instructions for generating the email.'),
});
export type GenerateEmailCampaignInput = z.infer<typeof GenerateEmailCampaignInputSchema>;

const GenerateEmailCampaignOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body of the email, formatted in markdown.'),
});
export type GenerateEmailCampaignOutput = z.infer<typeof GenerateEmailCampaignOutputSchema>;

export async function generateEmailCampaign(
  input: GenerateEmailCampaignInput
): Promise<GenerateEmailCampaignOutput> {
  return generateEmailCampaignFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailCampaignPrompt',
  input: { schema: GenerateEmailCampaignInputSchema },
  output: { schema: GenerateEmailCampaignOutputSchema },
  prompt: `You are an expert email copywriter.

  You will generate an email campaign based on the provided information. The body should be formatted in simple markdown.

  Email Type: {{{emailType}}}
  Tone: {{{tone}}}
  Key Points/Topic: {{{topic}}}
  {{#if targetAudience}}
  Target Audience: {{{targetAudience}}}
  {{/if}}
  {{#if additionalInstructions}}
  Additional Instructions: {{{additionalInstructions}}}
  {{/if}}

  Generate an engaging subject line and a full email body tailored to the audience and campaign type.`,
});

const generateEmailCampaignFlow = ai.defineFlow(
  {
    name: 'generateEmailCampaignFlow',
    inputSchema: GenerateEmailCampaignInputSchema,
    outputSchema: GenerateEmailCampaignOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
