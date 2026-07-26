import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const missingAdminConfig = [
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
].filter((key) => !process.env[key]);

if (missingAdminConfig.length > 0) {
  throw new Error(
    `Missing Firebase admin env vars: ${missingAdminConfig.join(", ")}.
` +
      "Set these in .env.local and restart the dev server."
  );
}

const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n");

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          privateKey,
        }),
      })
    : getApps()[0];

export const adminAuth = getAuth(app);

export async function verifyIdToken(token: string) {
  return adminAuth.verifyIdToken(token);
}
