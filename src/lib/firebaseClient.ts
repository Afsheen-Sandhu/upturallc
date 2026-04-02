import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseClient = { app: FirebaseApp; db: Firestore };

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

let cached: FirebaseClient | null = null;

export function getFirebaseClient(): FirebaseClient {
  if (cached) return cached;

  const config = {
    apiKey: requiredEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requiredEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: requiredEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(config);
  const db = getFirestore(app);
  cached = { app, db };
  return cached;
}

