import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRequest, buildParams, parseResponse } from "../../helpers";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workflowTemplate: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    tenant: { findUnique: vi.fn() },
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

vi.mock("@/lib/require-role", () => ({
  requireRole: vi.fn(() => null),
}));

vi.mock("@/lib/feature-gate", () => ({
  canCreateTemplate: vi.fn(() => ({ allowed: true })),
}));

import { prisma } from "@/lib/prisma";
import { canCreateTemplate } from "@/lib/feature-gate";

import { POST as createTemplateRaw, GET as listTemplatesRaw } from "@/app/api/templates/route";
import { PATCH as updateTemplateRaw } from "@/app/api/templates/[id]/route";

const createTemplate = createTemplateRaw as unknown as (req: Request) => Promise<Response>;
const listTemplates = listTemplatesRaw as unknown as (req: Request) => Promise<Response>;
const updateTemplate = updateTemplateRaw as unknown as (
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) => Promise<Response>;

const validTemplateBody = {
  name: "QC Workflow",
  stages: [
    { name: "Sample Receipt", requiredRole: "Technician" },
    { name: "QC Review", requiredRole: "SeniorScientist", isApprovalGate: true },
  ],
};

describe("POST /api/templates — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 402 when feature gate blocks", async () => {
    vi.mocked(canCreateTemplate).mockResolvedValueOnce({
      allowed: false,
      reason: "Workflow template limit reached",
    });

    const req = buildRequest({ body: validTemplateBody });
    const { status } = await parseResponse(await createTemplate(req));
    expect(status).toBe(402);
  });

  it("returns 400 for invalid body", async () => {
    const req = buildRequest({ body: { name: "No stages" } });
    const { status } = await parseResponse(await createTemplate(req));
    expect(status).toBe(400);
  });

  it("returns 201 for valid creation", async () => {
    vi.mocked(prisma.workflowTemplate.create).mockResolvedValueOnce({
      id: "template-1",
      tenantId: "tenant-1",
      name: "QC Workflow",
      stages: validTemplateBody.stages,
    } as never);

    const req = buildRequest({ body: validTemplateBody });
    const { status, body } = await parseResponse(await createTemplate(req));
    expect(status).toBe(201);
    expect(body.id).toBe("template-1");
    expect(body.tenantId).toBe("tenant-1");
  });
});

describe("GET /api/templates — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 200 with template list", async () => {
    vi.mocked(prisma.workflowTemplate.findMany).mockResolvedValueOnce([
      { id: "t1", tenantId: "tenant-1", name: "T1", stages: [] },
    ] as never);

    const req = buildRequest({ method: "GET" });
    const { status, body } = await parseResponse(await listTemplates(req));
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("PATCH /api/templates/[id] — smoke", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 for unknown template", async () => {
    vi.mocked(prisma.workflowTemplate.findUnique).mockResolvedValueOnce(null);

    const params = buildParams("nonexistent");
    const req = buildRequest({ body: { name: "Updated" } });
    const { status } = await parseResponse(await updateTemplate(req, { params }));
    expect(status).toBe(404);
  });

  it("returns 404 for other tenant's template", async () => {
    vi.mocked(prisma.workflowTemplate.findUnique).mockResolvedValueOnce({
      id: "t-other",
      tenantId: "tenant-2",
    } as never);

    const params = buildParams("t-other");
    const req = buildRequest({ body: { name: "Hacked" } });
    const { status } = await parseResponse(await updateTemplate(req, { params }));
    expect(status).toBe(404);
  });

  it("returns 200 for successful update", async () => {
    vi.mocked(prisma.workflowTemplate.findUnique).mockResolvedValueOnce({
      id: "t-1",
      tenantId: "tenant-1",
    } as never);

    vi.mocked(prisma.workflowTemplate.update).mockResolvedValueOnce({
      id: "t-1",
      tenantId: "tenant-1",
      name: "Updated",
      stages: validTemplateBody.stages,
    } as never);

    const params = buildParams("t-1");
    const req = buildRequest({ body: { name: "Updated" } });
    const { status, body } = await parseResponse(await updateTemplate(req, { params }));
    expect(status).toBe(200);
    expect(body.name).toBe("Updated");
  });
});
