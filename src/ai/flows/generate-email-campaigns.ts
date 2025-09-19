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
import { z } from 'genkit';

const GenerateEmailCampaignInputSchema = z.object({
  campaignType: z
    .enum(['update', 'notification', 'invitation'])
    .describe('The type of email campaign to generate.'),
  topic: z.string().describe('The topic of the email campaign.'),
  targetAudience: z.string().describe('The target audience for the email.'),
  desiredTone: z
    .string()
    .optional()
    .describe('The desired tone of the email (e.g., formal, friendly, urgent).'),
  additionalInstructions: z
    .string()
    .optional()
    .describe('Any additional instructions for generating the email.'),
});
export type GenerateEmailCampaignInput = z.infer<typeof GenerateEmailCampaignInputSchema>;

const GenerateEmailCampaignOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The body of the email.'),
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

  You will generate an email campaign based on the provided information.

  Campaign Type: {{{campaignType}}}
  Topic: {{{topic}}}
  Target Audience: {{{targetAudience}}}
  Desired Tone: {{{desiredTone}}}
  Additional Instructions: {{{additionalInstructions}}}

  Subject: (Provide an engaging subject line for the email)
  Body: (Write the full email body, tailored to the target audience and campaign type)`,
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
