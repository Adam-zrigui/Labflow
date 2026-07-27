import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

type FirebaseAdminApp = Awaited<
  ReturnType<typeof import("firebase-admin/app")["initializeApp"]>
>;

let _app: FirebaseAdminApp | null = null;

const firebaseJwks = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

function getFirebaseProjectId() {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "Missing Firebase project ID. Set FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }

  return projectId;
}

async function getApp() {
  if (_app) return _app;

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
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

export async function getAdminAuth() {
  const { getAuth } = await import("firebase-admin/auth");
  return getAuth(await getApp());
}

export async function verifyIdToken(token: string) {
  const projectId = getFirebaseProjectId();
  const { payload } = await jwtVerify(token, firebaseJwks, {
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  const uid = payload.sub;
  if (!uid) {
    throw new Error("Firebase ID token is missing a subject");
  }

  return {
    ...payload,
    uid,
    email: getStringClaim(payload, "email"),
  };
}

function getStringClaim(payload: JWTPayload, claim: string) {
  const value = payload[claim];
  return typeof value === "string" ? value : undefined;
}
