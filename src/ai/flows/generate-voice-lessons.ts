'use server';

/**
 * @fileOverview A flow for generating dynamic voice-based lessons from Q&A data with caching.
 *
 * This flow generates audio for a question and answer, stores the audio file in Cloud Storage,
 * and caches the public URL in Firestore to avoid repeated calls to the Text-to-Speech API.
 *
 * - generateVoiceLessons - A function that generates or retrieves voice-based lessons.
 * - GenerateVoiceLessonsInput - The input type for the generateVoiceLessons function.
 * - GenerateVoiceLessonsOutput - The return type for the generateVoiceLessons function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import {db, storage as adminStorage} from '@/lib/firebase-admin'; // Using admin SDK for DB and Storage
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

// Helper functions
async function generateTTSWithRetry(prompt: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {voiceName: 'Algenib'},
            },
          },
        },
        prompt,
      });
    } catch (error) {
      console.error(`TTS generation attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function processAudio(result: any): Promise<string> {
  if (!result.media) {
    throw new Error('No media returned from TTS API');
  }

  const audioBuffer = Buffer.from(
    result.media.url.substring(result.media.url.indexOf(',') + 1),
    'base64'
  );
  return `data:audio/wav;base64,${await toWav(audioBuffer)}`;
}

async function uploadToStorage(bucket: any, cacheId: string, type: 'question' | 'answer', dataUri: string): Promise<string> {
  const fileName = `audio/${cacheId}_${type}.wav`;
  const file = bucket.file(fileName);
  
  await file.save(Buffer.from(dataUri.split(',')[1], 'base64'), {
    metadata: { contentType: 'audio/wav' }
  });

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: '03-09-2491' // A very far-future date
  });

  return url;
}

const generateVoiceLessonsFlow = ai.defineFlow(
  {
    name: 'generateVoiceLessonsFlow',
    inputSchema: GenerateVoiceLessonsInputSchema,
    outputSchema: GenerateVoiceLessonsOutputSchema,
  },
  async input => {
    const cacheId = createHash('sha256')
      .update(input.question + input.answer)
      .digest('hex');
    const cacheRef = db.collection('ttsCache').doc(cacheId);

    // 1. Check cache with expiration (30 days)
    const cachedDoc = await cacheRef.get();
    if (cachedDoc.exists) {
      const data = cachedDoc.data();
      if (data && data.createdAt) {
        const cacheAge = Date.now() - data.createdAt.toDate().getTime();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (cacheAge < maxAge) {
          return {
            questionAudio: data.questionAudio,
            answerAudio: data.answerAudio,
          };
        }
      }
    }

    // 2. If not cached or expired, generate TTS with retry logic
    const questionResult = await generateTTSWithRetry(input.question);
    const answerResult = await generateTTSWithRetry(`The answer is, ${input.answer}`);

    // 3. Process audio to WAV format
    const questionWavDataUri = await processAudio(questionResult);
    const answerWavDataUri = await processAudio(answerResult);

    // 4. Store in Cloud Storage
    const bucket = adminStorage.bucket();
    const questionUrl = await uploadToStorage(bucket, cacheId, 'question', questionWavDataUri);
    const answerUrl = await uploadToStorage(bucket, cacheId, 'answer', answerWavDataUri);

    // 5. Save public URLs and timestamp in Firestore
    await cacheRef.set({
      questionAudio: questionUrl,
      answerAudio: answerUrl,
      createdAt: new Date()
    });

    return {
      questionAudio: questionUrl,
      answerAudio: answerUrl,
    };
  }
);
