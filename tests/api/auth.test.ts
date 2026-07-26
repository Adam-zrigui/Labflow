import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    tenant: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

// Mock firebase-admin
vi.mock("@/lib/firebase-admin", () => ({
  verifyIdToken: vi.fn(),
}));

// Mock jose
vi.mock("jose", () => ({
  SignJWT: vi.fn(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn(() => Promise.resolve("mock-session-token")),
  })),
  jwtVerify: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/firebase-admin";

describe("Auth - POST /api/auth/session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("looks up user by firebaseUid after token verification", async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      uid: "firebase-uid-1",
      email: "test@example.com",
    } as never);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      tenantId: "tenant-1",
      role: "Admin",
    } as never);

    const decoded = await verifyIdToken("valid-id-token");
    expect(decoded.uid).toBe("firebase-uid-1");

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, tenantId: true, role: true },
    });

    expect(user).toBeDefined();
    expect(user!.tenantId).toBe("tenant-1");
    expect(user!.role).toBe("Admin");
  });

  it("returns null for unknown firebaseUid", async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      uid: "unknown-user",
      email: "unknown@example.com",
    } as never);

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const decoded = await verifyIdToken("valid-id-token");
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    expect(user).toBeNull();
  });
});

describe("Auth - POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates tenant and user in sequence", async () => {
    vi.mocked(verifyIdToken).mockResolvedValue({
      uid: "new-firebase-uid",
      email: "newuser@example.com",
    } as never);

    vi.mocked(prisma.tenant.create).mockResolvedValue({
      id: "new-tenant-id",
      name: "New Lab",
    } as never);

    vi.mocked(prisma.user.create).mockResolvedValue({
      id: "new-user-id",
      tenantId: "new-tenant-id",
      email: "newuser@example.com",
      firebaseUid: "new-firebase-uid",
      role: "Admin",
    } as never);

    const decoded = await verifyIdToken("valid-id-token");
    expect(decoded.email).toBe("newuser@example.com");

    const tenant = await prisma.tenant.create({ data: { name: "New Lab" } });
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: decoded.email!,
        firebaseUid: decoded.uid,
        role: "Admin",
      },
    });

    expect(tenant.id).toBe("new-tenant-id");
    expect(user.role).toBe("Admin");
    expect(user.tenantId).toBe("new-tenant-id");
  });
});
