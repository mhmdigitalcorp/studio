'use server';

/**
 * @fileOverview A secure backend flow for managing application settings in Firestore.
 *
 * - manageSettings - The main function to handle settings data operations (get/set).
 * - ManageSettingsInput - The input type for the manageSettings function.
 * - ManageSettingsOutput - The return type for the manageSettings function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';

const SettingsDataSchema = z.object({
  provider: z.string().optional(),
  fromEmail: z.string().optional(),
  sendgridKey: z.string().optional(),
  smtpHost: z.string().optional(),
  smtpPort: z.string().optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  aiApiKey: z.string().optional(),
});
export type SettingsData = z.infer<typeof SettingsDataSchema>;

const ManageSettingsInputSchema = z.object({
  action: z.enum(['get', 'set']),
  settingsData: SettingsDataSchema.optional(),
});
export type ManageSettingsInput = z.infer<typeof ManageSettingsInputSchema>;

const ManageSettingsOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  settings: SettingsDataSchema.optional(),
});
export type ManageSettingsOutput = z.infer<typeof ManageSettingsOutputSchema>;

export async function manageSettings(input: ManageSettingsInput): Promise<ManageSettingsOutput> {
  return manageSettingsFlow(input);
}

const manageSettingsFlow = ai.defineFlow(
  {
    name: 'manageSettingsFlow',
    inputSchema: ManageSettingsInputSchema,
    outputSchema: ManageSettingsOutputSchema,
  },
  async (input) => {
    // In a real app, you would check admin privileges here.
    const settingsDocRef = db.collection('settings').doc('app-config');

    try {
      switch (input.action) {
        case 'get': {
          const doc = await settingsDocRef.get();
          if (!doc.exists) {
            return { success: true, message: 'No settings found.', settings: {} };
          }
          const settings = doc.data() as SettingsData;
          return { success: true, message: 'Settings fetched successfully.', settings };
        }

        case 'set': {
          if (!input.settingsData) {
            return { success: false, message: 'Settings data is missing for set action.' };
          }
          // To avoid storing undefined values in Firestore
          const settingsToSave = JSON.parse(JSON.stringify(input.settingsData));
          await settingsDocRef.set(settingsToSave, { merge: true });
          return { success: true, message: 'Settings updated successfully.', settings: settingsToSave };
        }

        default:
          return { success: false, message: 'Unsupported action.' };
      }
    } catch (error: any) {
      console.error(`Error in manageSettingsFlow action '${input.action}':`, error);
      return { success: false, message: `An error occurred: ${error.message}` };
    }
  }
);
