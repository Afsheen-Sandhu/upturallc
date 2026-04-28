import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

type FirebaseClient = { app: FirebaseApp; db: Firestore };

// This project is deployed to environments where NEXT_PUBLIC_* vars may not be
// injected into an already-built bundle until a rebuild occurs. To avoid
// hard-failing admin pages, we fall back to the known Firebase web config.
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBUPmtsWmM5tvFBDiloryBGgWBX9vIeU4w",
  authDomain: "uptura-leads.firebaseapp.com",
  projectId: "uptura-leads",
  storageBucket: "uptura-leads.firebasestorage.app",
  messagingSenderId: "146306181969",
  appId: "1:146306181969:web:c91b776edc33f652c2c170",
  measurementId: "G-ELHWMEHZ9W",
} as const;

function envOrFallback(name: string, fallback: string) {
  const v = process.env[name];
  return typeof v === "string" && v.trim() ? v : fallback;
}

let cached: FirebaseClient | null = null;

export function getFirebaseClient(): FirebaseClient {
  if (cached) return cached;

  const config = {
    apiKey: envOrFallback("NEXT_PUBLIC_FIREBASE_API_KEY", FALLBACK_FIREBASE_CONFIG.apiKey),
    authDomain: envOrFallback("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", FALLBACK_FIREBASE_CONFIG.authDomain),
    projectId: envOrFallback("NEXT_PUBLIC_FIREBASE_PROJECT_ID", FALLBACK_FIREBASE_CONFIG.projectId),
    storageBucket: envOrFallback(
      "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
      FALLBACK_FIREBASE_CONFIG.storageBucket
    ),
    messagingSenderId: envOrFallback(
      "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
      FALLBACK_FIREBASE_CONFIG.messagingSenderId
    ),
    appId: envOrFallback("NEXT_PUBLIC_FIREBASE_APP_ID", FALLBACK_FIREBASE_CONFIG.appId),
    measurementId: envOrFallback(
      "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
      FALLBACK_FIREBASE_CONFIG.measurementId
    ),
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(config);
  const db = getFirestore(app);
  cached = { app, db };
  return cached;
}

