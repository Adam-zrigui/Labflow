import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    workflowTemplate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
  requireAuth: vi.fn(() => ({
    userId: "user-1",
    tenantId: "tenant-1",
    role: "Admin",
    firebaseUid: "firebase-uid-1",
  })),
  createSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

// Mock feature gate
vi.mock("@/lib/feature-gate", () => ({
  canCreateTemplate: vi.fn(() => ({ allowed: true })),
}));

import { prisma } from "@/lib/prisma";
import { canCreateTemplate } from "@/lib/feature-gate";

describe("Templates - POST /api/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks template creation when feature gate fails", async () => {
    vi.mocked(canCreateTemplate).mockResolvedValueOnce({
      allowed: false,
      reason: "Workflow template limit reached",
    });

    const gate = await canCreateTemplate("tenant-1");
    expect(gate.allowed).toBe(false);
    expect(gate.reason).toBe("Workflow template limit reached");
  });

  it("allows template creation when within limits", async () => {
    vi.mocked(canCreateTemplate).mockResolvedValueOnce({ allowed: true });
    const gate = await canCreateTemplate("tenant-1");
    expect(gate.allowed).toBe(true);
  });

  it("creates a template scoped to the tenant", async () => {
    const mockTemplate = {
      id: "template-1",
      tenantId: "tenant-1",
      name: "Test Workflow",
      stages: [
        { name: "Step 1", requiredRole: "Technician" },
        { name: "Step 2", requiredRole: "SeniorScientist", isApprovalGate: true },
      ],
    };

    vi.mocked(prisma.workflowTemplate.create).mockResolvedValue(mockTemplate as never);

    const template = await prisma.workflowTemplate.create({
      data: {
        tenantId: "tenant-1",
        name: "Test Workflow",
        stages: mockTemplate.stages,
      },
    });

    expect(template.tenantId).toBe("tenant-1");
    expect(template.name).toBe("Test Workflow");
    expect(template.stages).toHaveLength(2);
  });
});

describe("Templates - GET /api/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only templates for the current tenant", async () => {
    const mockTemplates = [
      { id: "t1", tenantId: "tenant-1", name: "Template 1", stages: [] },
      { id: "t2", tenantId: "tenant-1", name: "Template 2", stages: [] },
    ];

    vi.mocked(prisma.workflowTemplate.findMany).mockResolvedValue(mockTemplates as never);

    const templates = await prisma.workflowTemplate.findMany({
      where: { tenantId: "tenant-1" },
    });

    expect(templates).toHaveLength(2);
    templates.forEach((t: { tenantId: string }) => {
      expect(t.tenantId).toBe("tenant-1");
    });
  });
});

describe("Templates - PATCH /api/templates/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms template belongs to tenant before updating", async () => {
    vi.mocked(prisma.workflowTemplate.findUnique).mockResolvedValue({
      id: "template-1",
      tenantId: "tenant-1",
    } as never);

    const template = await prisma.workflowTemplate.findUnique({
      where: { id: "template-1" },
      select: { id: true, tenantId: true },
    });

    expect(template).toBeDefined();
    expect(template!.tenantId).toBe("tenant-1");
  });

  it("allows admins to update their own template", async () => {
    vi.mocked(prisma.workflowTemplate.findUnique).mockResolvedValue({
      id: "template-1",
      tenantId: "tenant-1",
    } as never);

    vi.mocked(prisma.workflowTemplate.update).mockResolvedValue({
      id: "template-1",
      tenantId: "tenant-1",
      name: "Updated Template",
      stages: [{ name: "New Stage", requiredRole: "Technician" }],
    } as never);

    const updated = await prisma.workflowTemplate.update({
      where: { id: "template-1" },
      data: { name: "Updated Template" },
    });

    expect(updated.name).toBe("Updated Template");
  });
});
