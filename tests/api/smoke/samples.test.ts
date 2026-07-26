import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRequest, buildParams, parseResponse } from "../../helpers";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";

// Mock transaction client with all needed model methods
const mockTx = {
  sample: { create: vi.fn(), update: vi.fn() },
  sampleStageHistory: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  usageCounter: { upsert: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
    workflowTemplate: { findUnique: vi.fn() },
    sample: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    sampleStageHistory: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    usageCounter: { upsert: vi.fn() },
    auditLog: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("@/lib/firebase-admin", () => ({ verifyIdToken: vi.fn() }));

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn(() => ({
    userId: "user-1",
    tenantId: "tenant-1",
    role: "Admin",
    firebaseUid: "firebase-uid-1",
    email: "user@lab.com",
  })),
  requireApiAuth: vi.fn(() => ({
    session: {
      userId: "user-1",
      tenantId: "tenant-1",
      role: "Admin",
      firebaseUid: "firebase-uid-1",
      email: "user@lab.com",
    },
  })),
  getSession: vi.fn(() => ({
    userId: "user-1",
    tenantId: "tenant-1",
    role: "Admin",
    firebaseUid: "firebase-uid-1",
    email: "user@lab.com",
  })),
  createSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/lib/feature-gate", () => ({
  canRegisterSample: vi.fn(() => ({ allowed: true })),
}));

vi.mock("@/lib/audit", () => ({ writeAuditLog: vi.fn() }));
vi.mock("@/lib/queue", () => ({ enqueueSequencingJob: vi.fn() }));
vi.mock("@/lib/require-role", () => ({ requireRole: vi.fn(() => null) }));

import { prisma } from "@/lib/prisma";
import { canRegisterSample } from "@/lib/feature-gate";

import { POST as createSampleRaw, GET as listSamplesRaw } from "@/app/api/samples/route";
import { GET as getSampleRaw } from "@/app/api/samples/[id]/route";
import { POST as advanceSampleRaw } from "@/app/api/samples/[id]/advance/route";

const createSample = createSampleRaw as unknown as (req: Request) => Promise<Response>;
const listSamples = listSamplesRaw as unknown as (req: Request) => Promise<Response>;
const getSample = getSampleRaw as unknown as (
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) => Promise<Response>;
const advanceSample = advanceSampleRaw as unknown as (
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) => Promise<Response>;

describe("POST /api/samples — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 402 when feature gate blocks", async () => {
    vi.mocked(canRegisterSample).mockResolvedValueOnce({
      allowed: false,
      reason: "Monthly sample limit reached",
    });
    const req = buildRequest({ body: { workflowTemplateId: UUID, metadata: {} } });
    const { status, body } = await parseResponse(await createSample(req));
    expect(status).toBe(402);
    expect(body.error).toContain("limit");
  });

  it("returns 400 for invalid body", async () => {
    const req = buildRequest({ body: { wrongField: true } });
    const { status } = await parseResponse(await createSample(req));
    expect(status).toBe(400);
  });  it("returns 403 when template belongs to another tenant", async () => {
    vi.mocked(prisma.workflowTemplate.findUnique).mockResolvedValueOnce({
      id: "wt-other",
      tenantId: "tenant-2",
      stages: [],
    } as never);
    const req = buildRequest({ body: { workflowTemplateId: UUID2 } });
    const { status, body } = await parseResponse(await createSample(req));

    expect(status).toBe(403);
    expect(body.error).toContain("not found");
  });

  it("returns 201 for valid creation", async () => {
    vi.mocked(prisma.workflowTemplate.findUnique).mockResolvedValueOnce({
      id: "wt-1",
      tenantId: "tenant-1",
      stages: [{ name: "Stage 1", requiredRole: "Technician" }],
    } as never);
    vi.mocked(mockTx.sample.create).mockResolvedValueOnce({
      id: "sample-1",
      tenantId: "tenant-1",
      workflowTemplateId: "wt-1",
      currentStageIndex: 0,
      status: "in_progress",
      metadata: null,
      createdAt: new Date(),
    } as never);
    vi.mocked(mockTx.usageCounter.upsert).mockResolvedValueOnce({} as never);

    const req = buildRequest({
      body: { workflowTemplateId: UUID, metadata: { key: "val" } },
    });
    const { status, body } = await parseResponse(await createSample(req));
    expect(status).toBe(201);
    expect(body.id).toBe("sample-1");
  });
});

describe("GET /api/samples — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with sample list", async () => {
    vi.mocked(prisma.sample.findMany).mockResolvedValueOnce([
      { id: "s1", tenantId: "tenant-1", status: "in_progress", template: { name: "T1" } },
    ] as never);
    const req = buildRequest({ method: "GET", url: "http://localhost:3000/api/samples" });
    const { status, body } = await parseResponse(await listSamples(req));
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });

  it("filters by status query param", async () => {
    vi.mocked(prisma.sample.findMany).mockResolvedValueOnce([]);
    const req = buildRequest({ method: "GET", url: "http://localhost:3000/api/samples?status=flagged" });
    const { status } = await parseResponse(await listSamples(req));
    expect(status).toBe(200);
  });
});

describe("GET /api/samples/[id] — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 for unknown sample", async () => {
    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce(null);
    const params = buildParams("nonexistent");
    const req = buildRequest({ method: "GET" });
    const { status } = await parseResponse(await getSample(req, { params }));
    expect(status).toBe(404);
  });

  it("returns 404 for other tenant's sample (no leak)", async () => {
    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce({
      id: "s-other", tenantId: "tenant-2", history: [],
      template: { name: "Other", stages: [] },
    } as never);
    const params = buildParams("s-other");
    const req = buildRequest({ method: "GET" });
    const { status } = await parseResponse(await getSample(req, { params }));
    expect(status).toBe(404);
  });

  it("returns 200 with sample + audit logs for own sample", async () => {
    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce({
      id: "s-1", tenantId: "tenant-1", workflowTemplateId: "wt-1",
      currentStageIndex: 0, status: "in_progress", metadata: null,
      createdAt: new Date(),
      history: [{ id: "h1", stageIndex: 0, actorId: "user-1" }],
      template: { name: "Test", stages: [] },
    } as never);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([
      { id: "log-1", action: "created" },
    ] as never);

    const params = buildParams("s-1");
    const req = buildRequest({ method: "GET" });
    const { status, body } = await parseResponse(await getSample(req, { params }));
    expect(status).toBe(200);
    expect(body.id).toBe("s-1");
    expect(body.auditLogs).toHaveLength(1);
  });
});

describe("POST /api/samples/[id]/advance — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 for unknown sample", async () => {
    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce(null);
    const params = buildParams("nonexistent");
    const req = buildRequest({ body: {} });
    const { status } = await parseResponse(await advanceSample(req, { params }));
    expect(status).toBe(404);
  });

  it("returns 200 and advances the sample", async () => {
    const mockSample = {
      id: "s-1", tenantId: "tenant-1", workflowTemplateId: "wt-1",
      currentStageIndex: 0, status: "in_progress", metadata: null,
      createdAt: new Date(),
      template: {
        stages: [
          { name: "Step 1", requiredRole: "Technician" },
          { name: "Step 2", requiredRole: "SeniorScientist" },
        ],
      },
    };

    vi.mocked(prisma.sample.findUnique).mockResolvedValueOnce(mockSample as never);
    vi.mocked(mockTx.sampleStageHistory.findFirst).mockResolvedValueOnce({
      id: "h-1",
    } as never);
    vi.mocked(mockTx.sampleStageHistory.update).mockResolvedValueOnce({} as never);
    vi.mocked(mockTx.sampleStageHistory.create).mockResolvedValueOnce({} as never);
    vi.mocked(mockTx.sample.update).mockResolvedValueOnce({
      ...mockSample,
      currentStageIndex: 1,
    } as never);

    const params = buildParams("s-1");
    const req = buildRequest({ body: {} });
    const { status, body } = await parseResponse(await advanceSample(req, { params }));
    expect(status).toBe(200);
    expect(body.currentStageIndex).toBe(1);
  });
});
