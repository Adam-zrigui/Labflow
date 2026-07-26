import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";

// Mock next/headers for cookie operations
const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: mockGet,
    set: mockSet,
  })),
}));

// Mock jose for JWT signing/verification
// SignJWT must be a proper class constructor since code uses `new SignJWT()`
// Note: the class must be defined INSIDE the mock factory callback because
// vi.mock() is hoisted to the top of the file by Vitest.
vi.mock("jose", () => ({
  SignJWT: class {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_payload: unknown) {}
    setProtectedHeader() { return this; }
    setExpirationTime() { return this; }
    setIssuedAt() { return this; }
    sign() { return Promise.resolve("mock-jwt-token"); }
  },
  jwtVerify: vi.fn(),
}));

import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { getSession, requireAuth, requireApiAuth, createSessionCookie, clearSessionCookie } from "@/lib/auth";

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no session cookie exists", async () => {
    mockGet.mockReturnValue({ value: undefined });
    const result = await getSession();
    expect(result).toBeNull();
  });

  it("returns null when cookie exists but JWT is invalid", async () => {
    mockGet.mockReturnValue({ value: "invalid-token" });
    vi.mocked(jwtVerify).mockRejectedValueOnce(new Error("Invalid token"));

    const result = await getSession();
    expect(result).toBeNull();
  });

  it("returns session when JWT is valid", async () => {
    mockGet.mockReturnValue({ value: "valid-token" });
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: {
        userId: "user-1",
        tenantId: "tenant-1",
        role: "Admin",
        firebaseUid: "firebase-uid-1",
        email: "test@example.com",
      },
    } as never);

    const result = await getSession();
    expect(result).not.toBeNull();
    expect(result!.userId).toBe("user-1");
    expect(result!.tenantId).toBe("tenant-1");
    expect(result!.role).toBe("Admin");
    expect(result!.email).toBe("test@example.com");
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls redirect when no session exists", async () => {
    mockGet.mockReturnValue({ value: undefined });
    // redirect is mocked as vi.fn() in setup, so it doesn't throw;
    // verify redirect was called and function returns
    const result = await requireAuth();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns session when authenticated", async () => {
    mockGet.mockReturnValue({ value: "valid-token" });
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: {
        userId: "user-2",
        tenantId: "tenant-1",
        role: "Technician",
        firebaseUid: "firebase-uid-2",
        email: "tech@example.com",
      },
    } as never);

    const result = await requireAuth();
    expect(result.userId).toBe("user-2");
  });
});

describe("requireApiAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error response when no session exists", async () => {
    mockGet.mockReturnValue({ value: undefined });
    const result = await requireApiAuth();
    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(401);
    expect(result.session).toBeUndefined();
  });

  it("returns session when authenticated", async () => {
    mockGet.mockReturnValue({ value: "valid-token" });
    vi.mocked(jwtVerify).mockResolvedValueOnce({
      payload: {
        userId: "user-3",
        tenantId: "tenant-2",
        role: "SeniorScientist",
        firebaseUid: "firebase-uid-3",
        email: "senior@example.com",
      },
    } as never);

    const result = await requireApiAuth();
    expect(result.session).toBeDefined();
    expect(result.session!.userId).toBe("user-3");
    expect(result.error).toBeUndefined();
  });
});

describe("createSessionCookie / clearSessionCookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets a session cookie with the provided payload", async () => {
    const response = await createSessionCookie({
      firebaseUid: "firebase-u1",
      userId: "user-1",
      tenantId: "tenant-1",
      role: "Admin",
      email: "admin@example.com",
    });

    expect(response).toBeInstanceOf(NextResponse);
    const cookie = response.cookies.get("session");
    expect(cookie).toBeDefined();
    expect(cookie!.value).toBe("mock-jwt-token");
    expect(cookie).toMatchObject({
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  it("clears the session cookie", async () => {
    const response = await clearSessionCookie();
    expect(response).toBeInstanceOf(NextResponse);
    const cookie = response.cookies.get("session");
    expect(cookie).toBeDefined();
    expect(cookie!.value).toBe("");
    expect(cookie!.maxAge).toBe(0);
  });
});
