import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Client-config style Firebase initialization (not secret).
// This repo already uses this config on the frontend (admin-dashboard.html, etc.).
const firebaseConfig = {
  apiKey: "AIzaSyBUPmtsWmM5tvFBDiloryBGgWBX9vIeU4w",
  authDomain: "uptura-leads.firebaseapp.com",
  projectId: "uptura-leads",
  storageBucket: "uptura-leads.firebasestorage.app",
  messagingSenderId: "146306181969",
  appId: "1:146306181969:web:c91b776edc33f652c2c170",
  measurementId: "G-ELHWMEHZ9W",
};

export function getDb() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

