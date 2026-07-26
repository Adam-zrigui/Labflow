import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the module under test
vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
    },
    workflowTemplate: {
      count: vi.fn(),
    },
  },
}));

// Import after mock is set up
import { prisma } from "@/lib/prisma";
import { canRegisterSample, canCreateTemplate } from "@/lib/feature-gate";

const mockTenantWithPlan = {
  id: "tenant-1",
  name: "Test Lab",
  subscriptionStatus: "active",
  plan: {
    maxSamplesPerMonth: 100,
    maxWorkflowTemplates: 10,
    hasInstrumentWebhook: true,
  },
  usage: [
    {
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      sampleCount: 50,
    },
  ],
};

const mockTenantAtLimit = {
  ...mockTenantWithPlan,
  usage: [
    {
      periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      sampleCount: 100,
    },
  ],
};

describe("canRegisterSample", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allowed when under the monthly limit", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenantWithPlan as never);

    const result = await canRegisterSample("tenant-1");
    expect(result.allowed).toBe(true);
  });

  it("returns blocked when at the monthly limit", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenantAtLimit as never);

    const result = await canRegisterSample("tenant-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("limit");
  });

  it("returns blocked when subscription is canceled", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      ...mockTenantWithPlan,
      subscriptionStatus: "canceled",
    } as never);

    const result = await canRegisterSample("tenant-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Subscription");
  });

  it("returns blocked when no plan exists", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      ...mockTenantWithPlan,
      plan: null,
    } as never);

    const result = await canRegisterSample("tenant-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("plan");
  });
});

describe("canCreateTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns allowed when under the template limit", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenantWithPlan as never);
    vi.mocked(prisma.workflowTemplate.count).mockResolvedValue(5);

    const result = await canCreateTemplate("tenant-1");
    expect(result.allowed).toBe(true);
  });

  it("returns blocked when at the template limit", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(mockTenantWithPlan as never);
    vi.mocked(prisma.workflowTemplate.count).mockResolvedValue(10);

    const result = await canCreateTemplate("tenant-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("limit");
  });
});
