import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { buildSessionToken, verifySessionToken, type SessionPayload } from "./session";

export interface Session extends SessionPayload {}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Attach a session cookie to the given (or a new) NextResponse.
 * Route handlers should pass their response through so the cookie is
 * guaranteed on the returned object.
 */
export async function createSessionCookie(
  payload: SessionPayload,
  response?: NextResponse
): Promise<NextResponse> {
  const token = await buildSessionToken(payload);
  const res = response ?? NextResponse.json({ success: true });
  res.cookies.set("session", token, COOKIE_OPTIONS);
  return res;
}

export async function clearSessionCookie(): Promise<NextResponse> {
  const res = NextResponse.json({ success: true });
  res.cookies.set("session", "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return res;
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;

    if (!sessionCookie) {
      return null;
    }

    return await verifySessionToken(sessionCookie);
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

/**
 * For API route handlers — returns a JSON 401 response instead of redirecting.
 * Routes should check `result.error` first, then use `result.session`.
 */
export type ApiAuthResult =
  | { session: Session; error?: undefined }
  | { session?: undefined; error: NextResponse<{ error: string }> };

export async function requireApiAuth(): Promise<ApiAuthResult> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { session };
}
