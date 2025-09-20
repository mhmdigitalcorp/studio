// src/lib/firebase-admin.ts
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { ServiceAccount } from 'firebase-admin/app';

let app: App;
const BUCKET_NAME = 'studio-5887976942-d4420.appspot.com';

if (!getApps().length) {
  const serviceAccount: ServiceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  };

  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: BUCKET_NAME,
  });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
