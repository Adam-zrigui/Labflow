import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!firebaseApiKey || !firebaseAuthDomain || !firebaseProjectId) {
  const missing = [
    !firebaseApiKey && "NEXT_PUBLIC_FIREBASE_API_KEY",
    !firebaseAuthDomain && "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    !firebaseProjectId && "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  ]
    .filter(Boolean)
    .join(", ");

  throw new Error(
    `Missing Firebase client env vars: ${missing}. ` +
      "Set these in .env.local and restart the dev server."
  );
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
