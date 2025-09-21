// src/lib/firebase-admin.ts
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

// When deployed on Google Cloud infrastructure (like App Hosting),
// initializeApp() can automatically discover the service account credentials.
if (!getApps().length) {
  app = initializeApp({
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
} else {
  app = getApps()[0];
}

const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
