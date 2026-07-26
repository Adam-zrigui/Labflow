import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export interface SessionPayload {
  firebaseUid: string;
  userId: string;
  tenantId: string;
  role: string;
}

export const SESSION_COOKIE_NAME = "session";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-dev-secret-do-not-use-in-production"
);

export async function buildSessionToken(payload: SessionPayload) {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });

  if (
    typeof payload.firebaseUid !== "string" ||
    typeof payload.userId !== "string" ||
    typeof payload.tenantId !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid session payload");
  }

  return {
    firebaseUid: payload.firebaseUid,
    userId: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role,
  };
}
