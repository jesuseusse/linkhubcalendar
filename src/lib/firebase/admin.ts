import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

function initAdmin(): App | null {
  if (getApps().length > 0) return getApps()[0];
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  if (!projectId) {
    console.warn('Firebase Admin: missing FIREBASE_ADMIN_PROJECT_ID, skipping init');
    return null;
  }
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const adminApp = initAdmin();

export const adminAuth = adminApp ? getAuth(adminApp) : (null as unknown as Auth);
export const adminDb = adminApp ? getFirestore(adminApp) : (null as unknown as Firestore);
export const adminStorage = adminApp ? getStorage(adminApp) : (null as unknown as Storage);
export { adminApp };
