import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let _app: ReturnType<typeof initializeApp> | null = null;

function getApp() {
  if (_app) return _app;

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      `Missing Firebase admin env vars: ${[
        !projectId && "FIREBASE_ADMIN_PROJECT_ID",
        !clientEmail && "FIREBASE_ADMIN_CLIENT_EMAIL",
        !privateKeyRaw && "FIREBASE_ADMIN_PRIVATE_KEY",
      ]
        .filter(Boolean)
        .join(", ")}. Set these in your Vercel environment variables.`
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  _app =
    getApps().length === 0
      ? initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        })
      : getApps()[0];

  return _app;
}

export function getAdminAuth() {
  return getAuth(getApp());
}

export async function verifyIdToken(token: string) {
  return getAdminAuth().verifyIdToken(token);
}
