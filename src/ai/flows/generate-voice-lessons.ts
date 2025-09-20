'use server';

/**
 * @fileOverview A flow for generating dynamic voice-based lessons from Q&A data with caching.
 *
 * This flow generates audio for a question and answer, and caches the result in Firestore
 * to avoid repeated calls to the Text-to-Speech API.
 *
 * - generateVoiceLessons - A function that generates or retrieves voice-based lessons.
 * - GenerateVoiceLessonsInput - The input type for the generateVoiceLessons function.
 * - GenerateVoiceLessonsOutput - The return type for the generateVoiceLessons function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import {db} from '@/lib/firebase-admin'; // Using admin SDK for DB operations
import {createHash} from 'crypto';

const GenerateVoiceLessonsInputSchema = z.object({
  question: z.string().describe('The question to be answered.'),
  answer: z.string().describe('The answer to the question.'),
});

export type GenerateVoiceLessonsInput = z.infer<typeof GenerateVoiceLessonsInputSchema>;

const GenerateVoiceLessonsOutputSchema = z.object({
  questionAudio: z.string().describe('The audio data URI for the question.'),
  answerAudio: z.string().describe('The audio data URI for the answer.'),
});

export type GenerateVoiceLessonsOutput = z.infer<typeof GenerateVoiceLessonsOutputSchema>;

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

export async function generateVoiceLessons(
  input: GenerateVoiceLessonsInput
): Promise<GenerateVoiceLessonsOutput> {
  return generateVoiceLessonsFlow(input);
}

const generateVoiceLessonsFlow = ai.defineFlow(
  {
    name: 'generateVoiceLessonsFlow',
    inputSchema: GenerateVoiceLessonsInputSchema,
    outputSchema: GenerateVoiceLessonsOutputSchema,
  },
  async input => {
    // 1. Create a unique, stable ID for the text content.
    const cacheId = createHash('sha256')
      .update(input.question + input.answer)
      .digest('hex');
    const cacheRef = db.collection('ttsCache').doc(cacheId);

    // 2. Check if the audio is already in the cache.
    const cachedDoc = await cacheRef.get();
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      if (data) {
        return {
          questionAudio: data.questionAudio,
          answerAudio: data.answerAudio,
        };
      }
    }

    // 3. If not cached, generate the audio for the question.
    const questionResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: input.question,
    });

    if (!questionResult.media) {
      throw new Error('No media returned for question');
    }

    const questionAudioBuffer = Buffer.from(
      questionResult.media.url.substring(questionResult.media.url.indexOf(',') + 1),
      'base64'
    );
    const questionWavDataUri = `data:audio/wav;base64,${await toWav(questionAudioBuffer)}`;

    // 4. Generate the audio for the answer.
    const answerResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Algenib'},
          },
        },
      },
      prompt: `The answer is, ${input.answer}`,
    });

    if (!answerResult.media) {
      throw new Error('No media returned for answer');
    }

    const answerAudioBuffer = Buffer.from(
      answerResult.media.url.substring(answerResult.media.url.indexOf(',') + 1),
      'base64'
    );
    const answerWavDataUri = `data:audio/wav;base64,${await toWav(answerAudioBuffer)}`;

    const result = {
      questionAudio: questionWavDataUri,
      answerAudio: answerWavDataUri,
    };
    
    // 5. Save the newly generated audio to the cache.
    await cacheRef.set(result);

    return result;
  }
);
