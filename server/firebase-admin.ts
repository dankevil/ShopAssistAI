import admin from 'firebase-admin';
import { config } from './config';

// Initialize Firebase Admin SDK with environment variables
// This uses the default Google Cloud credentials
// In production, the service account is automatically provided
// In development, you can use a service account key file or set GOOGLE_APPLICATION_CREDENTIALS
// Learn more: https://firebase.google.com/docs/admin/setup

// Check if already initialized
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

export { admin };

// Verify Firebase ID token
export async function verifyFirebaseToken(token: string): Promise<admin.auth.DecodedIdToken> {
  try {
    return await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    throw new Error('Invalid Firebase token');
  }
}