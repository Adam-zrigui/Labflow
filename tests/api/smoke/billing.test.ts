import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRequest, parseResponse } from "../../helpers";

process.env.STRIPE_SECRET_KEY = "sk_test_mock";

// Stripe must be a constructable function for `new Stripe()`
vi.mock("stripe", () => ({
  default: function () {
    return {
      customers: {
        create: vi.fn(() => ({ id: "cus_mock_new" })),
      },
      checkout: {
        sessions: {
          create: vi.fn(() => ({ url: "https://checkout.stripe.com/test" })),
        },
      },
      billingPortal: {
        sessions: {
          create: vi.fn(() => ({ url: "https://portal.stripe.com/test" })),
        },
      },
    };
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    plan: { findUnique: vi.fn() },
    tenant: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("@/lib/auth", () => ({
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
}));

import { prisma } from "@/lib/prisma";
import { POST as checkoutRaw } from "@/app/api/checkout/route";
import { POST as portalRaw } from "@/app/api/billing/portal/route";

const checkout = checkoutRaw as unknown as (req: Request) => Promise<Response>;
const portal = portalRaw as unknown as (req: Request) => Promise<Response>;

const mockPlan = {
  id: "plan-1",
  name: "Pro",
  stripePriceId: "price_123",
  maxSamplesPerMonth: 1000,
  maxWorkflowTemplates: 20,
  maxUsers: 10,
  hasInstrumentWebhook: true,
};

describe("POST /api/checkout — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when planId is missing", async () => {
    const req = buildRequest({ body: {} });
    const { status } = await parseResponse(await checkout(req));
    expect(status).toBe(400);
  });

  it("returns 404 when plan does not exist", async () => {
    vi.mocked(prisma.plan.findUnique).mockResolvedValueOnce(null);
    const req = buildRequest({ body: { planId: "nonexistent" } });
    const { status } = await parseResponse(await checkout(req));
    expect(status).toBe(404);
  });

  it("returns 200 with a checkout URL for valid plan", async () => {
    vi.mocked(prisma.plan.findUnique).mockResolvedValueOnce(mockPlan as never);
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
      id: "tenant-1",
      stripeCustomerId: null,
      name: "Test Lab",
      planId: null,
      subscriptionStatus: "trialing",
      createdAt: new Date(),
    } as never);

    const req = buildRequest({ body: { planId: "plan-1" } });
    const { status, body } = await parseResponse(await checkout(req));
    expect(status).toBe(200);
    expect(body).toHaveProperty("url");
    expect(body.url).toContain("checkout.stripe.com");
  });
});

describe("POST /api/billing/portal — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when tenant has no stripeCustomerId", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
      stripeCustomerId: null,
    } as never);
    const req = buildRequest({ method: "POST" });
    const { status } = await parseResponse(await portal(req));
    expect(status).toBe(400);
  });

  it("returns 200 with portal URL when customer exists", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValueOnce({
      stripeCustomerId: "cus_mock123",
    } as never);
    const req = buildRequest({ method: "POST" });
    const { status, body } = await parseResponse(await portal(req));
    expect(status).toBe(200);
    expect(body).toHaveProperty("url");
    expect(body.url).toContain("portal.stripe.com");
  });
});
