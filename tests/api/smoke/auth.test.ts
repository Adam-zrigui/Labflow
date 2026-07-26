import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRequest, parseResponse } from "../../helpers";

// Mock all external dependencies before importing route handlers
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    tenant: { create: vi.fn() },
  },
}));

vi.mock("@/lib/firebase-admin", () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return {
    ...actual,
    requireAuth: vi.fn(() => ({
      userId: "user-1",
      tenantId: "tenant-1",
      role: "Admin",
      firebaseUid: "firebase-uid-1",
    })),
    getSession: vi.fn(() => ({
      userId: "user-1",
      tenantId: "tenant-1",
      role: "Admin",
      firebaseUid: "firebase-uid-1",
    })),
    createSessionCookie: vi.fn(),
    clearSessionCookie: vi.fn(),
  };
});

vi.mock("jose", () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn(() => Promise.resolve("mock-jwt-token")),
  })),
  jwtVerify: vi.fn(() =>
    Promise.resolve({
      payload: {
        userId: "user-1",
        tenantId: "tenant-1",
        role: "Admin",
        firebaseUid: "firebase-uid-1",
      },
    })
  ),
}));

import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/firebase-admin";
import { POST as sessionPostRaw, DELETE as sessionDeleteRaw } from "@/app/api/auth/session/route";
import { POST as registerPostRaw } from "@/app/api/auth/register/route";

// Cast to accept plain Request for test compatibility
const sessionPost = sessionPostRaw as unknown as (req: Request) => Promise<Response>;
const sessionDelete = sessionDeleteRaw as unknown as () => Promise<Response>;
const registerPost = registerPostRaw as unknown as (req: Request) => Promise<Response>;

describe("POST /api/auth/session — smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when idToken is missing", async () => {
    const req = buildRequest({ body: {} });
    const { status, body } = await parseResponse(await sessionPost(req));
    expect(status).toBe(400);
    expect(body.error).toBe("Missing ID token");
  });

  it("returns 401 when token is invalid", async () => {
    vi.mocked(verifyIdToken).mockRejectedValueOnce(new Error("Invalid token"));
    const req = buildRequest({ body: { idToken: "bad-token" } });
    const { status } = await parseResponse(await sessionPost(req));
    expect(status).toBe(401);
  });

  it("returns 401 when no matching user exists", async () => {
    vi.mocked(verifyIdToken).mockResolvedValueOnce({
      uid: "unknown-uid",
      email: "noone@example.com",
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const req = buildRequest({ body: { idToken: "valid-token-no-user" } });
    const { status, body } = await parseResponse(await sessionPost(req));
    expect(status).toBe(401);
    expect(body.error).toBe("User not found");
  });

  it("returns 200 on successful login", async () => {
    vi.mocked(verifyIdToken).mockResolvedValueOnce({
      uid: "firebase-uid-1",
      email: "user@lab.com",
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "user-1",
      tenantId: "tenant-1",
      role: "Admin",
    } as never);

    const req = buildRequest({ body: { idToken: "valid-token" } });
    const { status, body } = await parseResponse(await sessionPost(req));
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe("DELETE /api/auth/session — smoke", () => {
  it("returns 200 and clears the cookie", async () => {
    const res = await sessionDelete();
    const { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe("POST /api/auth/register — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when labName is missing", async () => {
    const req = buildRequest({ body: { idToken: "abc" } });
    const { status } = await parseResponse(await registerPost(req));
    expect(status).toBe(400);
  });

  it("returns 400 when both fields missing", async () => {
    const req = buildRequest({ body: {} });
    const { status } = await parseResponse(await registerPost(req));
    expect(status).toBe(400);
  });
});
