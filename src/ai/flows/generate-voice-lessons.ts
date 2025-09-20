
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
import {db, storage} from '@/lib/firebase-admin'; // Using admin SDK for DB and Storage
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

async function uploadToStorage(cacheId: string, type: 'question' | 'answer', dataUri: string): Promise<string> {
  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error('Storage bucket name not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
    }

    const bucket = storage.bucket(bucketName);
    
    const [exists] = await bucket.exists();
    if (!exists) {
      throw new Error(`Storage bucket "${bucketName}" does not exist. Please create it in Firebase Console.`);
    }

    const fileName = `audio/${cacheId}_${type}.wav`;
    const file = bucket.file(fileName);
    
    const fileBuffer = Buffer.from(dataUri.split(',')[1], 'base64');
    
    await file.save(fileBuffer, {
      metadata: {
        contentType: 'audio/wav',
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
    });

    await file.makePublic();

    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
    
  } catch (error) {
    console.error('Failed to upload to Cloud Storage:', error);
    
    if (dataUri.length < 900000) { 
      console.log('Using data URI as fallback for audio storage');
      return dataUri;
    } else {
      throw new Error('Audio file too large for fallback storage');
    }
  }
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

    try {
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

      // 4. Try to store in Cloud Storage, fallback to data URI if needed
      let questionUrl: string;
      let answerUrl: string;

      try {
        questionUrl = await uploadToStorage(cacheId, 'question', questionWavDataUri);
        answerUrl = await uploadToStorage(cacheId, 'answer', answerWavDataUri);
      } catch (storageError) {
        console.error('Storage failed, using data URIs:', storageError);
        questionUrl = questionWavDataUri;
        answerUrl = answerWavDataUri;
      }

      // 5. Save URLs and timestamp in Firestore
      if (!questionUrl.startsWith('data:') && !answerUrl.startsWith('data:')) {
        await cacheRef.set({
          questionAudio: questionUrl,
          answerAudio: answerUrl,
          createdAt: new Date()
        });
      } else {
        console.log('Skipping Firestore cache for data URIs (size considerations)');
      }

      return {
        questionAudio: questionUrl,
        answerAudio: answerUrl,
      };

    } catch (error: any) {
      console.error('Error in generateVoiceLessonsFlow:', error);
      throw new Error(`Failed to generate voice lessons: ${error.message}`);
    }
  }
);
