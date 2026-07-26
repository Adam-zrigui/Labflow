import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRequest, parseResponse } from "../../helpers";

process.env.INSTRUMENT_WEBHOOK_SECRET = "test-instrument-secret";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test-secret";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";

const SAMPLE_ID = "550e8400-e29b-41d4-a716-446655440000";
const SAMPLE_ID2 = "550e8400-e29b-41d4-a716-446655440001";

// Stripe must be a constructable function for `new Stripe()`
vi.mock("stripe", () => ({
  default: function () {
    return {
      webhooks: {
        constructEvent: vi.fn(() => ({
          id: "evt_test_123",
          type: "checkout.session.completed",
          data: {
            object: {
              client_reference_id: "tenant-1",
              customer: "cus_mock_123",
            },
          },
        })),
      },
    };
  },
}));

const mockTxWebhook = {
  sample: { create: vi.fn(), update: vi.fn() },
  sampleStageHistory: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn: (tx: typeof mockTxWebhook) => unknown) => fn(mockTxWebhook)),
    sample: { findUnique: vi.fn(), update: vi.fn() },
    sampleStageHistory: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
    tenant: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    auditLog: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));

vi.mock("@/lib/feature-gate", () => ({
  canUseInstrumentWebhook: vi.fn(() => true),
}));

import { prisma } from "@/lib/prisma";
import { canUseInstrumentWebhook } from "@/lib/feature-gate";

import { POST as instrumentWebhookRaw } from "@/app/api/webhooks/instrument/route";
import { POST as stripeWebhookRaw } from "@/app/api/webhooks/stripe/route";

const instrumentWebhook = instrumentWebhookRaw as unknown as (req: Request) => Promise<Response>;
const stripeWebhook = stripeWebhookRaw as unknown as (req: Request) => Promise<Response>;

describe("POST /api/webhooks/instrument — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when secret header is missing", async () => {
    const req = buildRequest({
      body: { sampleId: SAMPLE_ID, result: { value: 5.0, unit: "mg/L" } },
      headers: {},
    });
    const { status } = await parseResponse(await instrumentWebhook(req));
    expect(status).toBe(401);
  });

  it("returns 401 when secret header is wrong", async () => {
    const req = buildRequest({
      body: { sampleId: SAMPLE_ID, result: { value: 5.0, unit: "mg/L" } },
      headers: { "x-instrument-secret": "wrong-secret" },
    });
    const { status } = await parseResponse(await instrumentWebhook(req));
    expect(status).toBe(401);
  });

  it("returns 400 for invalid body", async () => {
    const req = buildRequest({
      body: { wrong: true },
      headers: { "x-instrument-secret": "test-instrument-secret" },
    });
    const { status } = await parseResponse(await instrumentWebhook(req));
    expect(status).toBe(400);
  });

  it("returns 403 when tenant's plan lacks instrument webhooks", async () => {
    vi.mocked(canUseInstrumentWebhook).mockResolvedValueOnce(false);
    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce({
      id: SAMPLE_ID,
      tenantId: "tenant-1",
      template: { stages: [] },
      metadata: {},
      currentStageIndex: 0,
      status: "in_progress",
      tenant: { planId: "basic" },
    } as never);

    const req = buildRequest({
      body: { sampleId: SAMPLE_ID, result: { value: 5.0, unit: "mg/L" } },
      headers: { "x-instrument-secret": "test-instrument-secret" },
    });
    const { status } = await parseResponse(await instrumentWebhook(req));
    expect(status).toBe(403);
  });

  it("returns flagged=true when result is out of range", async () => {
    vi.mocked(canUseInstrumentWebhook).mockResolvedValueOnce(true);
    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce({
      id: SAMPLE_ID,
      tenantId: "tenant-1",
      template: { stages: [{ name: "Analysis", requiredRole: "Technician" }] },
      metadata: {},
      currentStageIndex: 0,
      status: "in_progress",
      tenant: { planId: "pro" },
    } as never);
    vi.mocked(prisma.sampleStageHistory.findFirst).mockResolvedValueOnce(null);

    const req = buildRequest({
      body: {
        sampleId: SAMPLE_ID,
        result: { value: 15.0, unit: "mg/L", referenceRange: "3.0-10.0" },
      },
      headers: { "x-instrument-secret": "test-instrument-secret" },
    });
    const { status, body } = await parseResponse(await instrumentWebhook(req));
    expect(status).toBe(200);
    expect(body.flagged).toBe(true);
  });

  it("returns success for in-range result", async () => {
    vi.mocked(canUseInstrumentWebhook).mockResolvedValueOnce(true);
    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce({
      id: SAMPLE_ID2,
      tenantId: "tenant-1",
      template: {
        stages: [
          { name: "Analysis", requiredRole: "Technician" },
          { name: "Review", requiredRole: "SeniorScientist" },
        ],
      },
      metadata: {},
      currentStageIndex: 0,
      status: "in_progress",
      tenant: { planId: "pro" },
    } as never);
    vi.mocked(prisma.sampleStageHistory.findFirst).mockResolvedValueOnce({
      id: "h-1",
    } as never);
    vi.mocked(prisma.sampleStageHistory.update).mockResolvedValueOnce({} as never);
    vi.mocked(prisma.sampleStageHistory.create).mockResolvedValueOnce({} as never);

    const req = buildRequest({
      body: {
        sampleId: SAMPLE_ID2,
        result: { value: 5.0, unit: "mg/L", referenceRange: "3.0-10.0" },
      },
      headers: { "x-instrument-secret": "test-instrument-secret" },
    });
    const { status, body } = await parseResponse(await instrumentWebhook(req));
    expect(status).toBe(200);
    expect(body.flagged).toBeUndefined();
  });
});

describe("POST /api/webhooks/stripe — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 for successfully processed events", async () => {
    const req = buildRequest({
      body: JSON.stringify({ id: "evt_new", type: "checkout.session.completed" }),
      headers: {
        "stripe-signature": "valid_signature",
        "content-type": "application/json",
      },
    });
    const { status } = await parseResponse(await stripeWebhook(req));
    expect(status).toBe(200);
  });

  it("handles duplicate events gracefully", async () => {
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValueOnce({
      id: "existing-log",
    } as never);

    const req = buildRequest({
      body: JSON.stringify({ id: "evt_dup", type: "checkout.session.completed" }),
      headers: {
        "stripe-signature": "valid_signature",
        "content-type": "application/json",
      },
    });
    const { status } = await parseResponse(await stripeWebhook(req));
    expect(status).toBe(200);
  });
});
