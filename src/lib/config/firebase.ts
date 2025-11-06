// src/lib/config/firebase.ts
// ⚠️ NEVER USE FIREBASE AGAIN - ALL DATA IS IN DYNAMODB
// Firebase is intentionally unconfigured (no env vars set) and will NEVER be used again
// Event data, artist data, and venue data are in DynamoDB via api.bndy.co.uk
// DO NOT FIX, DO NOT EXTEND, DO NOT USE - This file exists only for legacy admin tool compatibility
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Check if Firebase credentials are available
const hasFirebaseConfig =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let dbInstance: Firestore | null = null;

if (hasFirebaseConfig) {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  };

  // Initialize Firebase (only once)
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  dbInstance = getFirestore(app);
} else {
}

// Export db with type assertion to avoid null checks everywhere
// Firebase features will simply not work without credentials, which is acceptable
export { app, auth };
export const db = dbInstance as Firestore;