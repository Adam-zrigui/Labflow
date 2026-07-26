import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { redirect } from "next/navigation";

export interface Session {
  userId: string;
  tenantId: string;
  role: string;
  firebaseUid: string;
}

export interface SessionPayload {
  firebaseUid: string;
  userId: string;
  tenantId: string;
  role: string;
}

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-dev-secret-do-not-use-in-production"
);

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as import("jose").JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("session", token, COOKIE_OPTIONS);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { ...COOKIE_OPTIONS, maxAge: 0 });
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return null;
    }

    const { payload } = await jwtVerify(sessionCookie, secret, {
      algorithms: ["HS256"],
    });

    return {
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      role: payload.role as string,
      firebaseUid: payload.firebaseUid as string,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
