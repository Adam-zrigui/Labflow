import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

describe("writeAuditLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an audit log entry with the provided fields", async () => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({
      id: "log-1",
      entityType: "Sample",
      entityId: "sample-1",
      actorId: "user-1",
      action: "created",
      before: null,
      after: { workflowTemplateId: "wt-1" },
      timestamp: new Date(),
    } as never);

    const result = await writeAuditLog(
      "Sample",
      "sample-1",
      "user-1",
      "created",
      null,
      { workflowTemplateId: "wt-1" }
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        entityType: "Sample",
        entityId: "sample-1",
        actorId: "user-1",
        action: "created",
        before: null,
        after: { workflowTemplateId: "wt-1" },
      },
    });

    expect(result.id).toBe("log-1");
  });

  it("stores before/after snapshots correctly", async () => {
    const before = { status: "in_progress", currentStageIndex: 0 };
    const after = { status: "completed", currentStageIndex: 1 };

    vi.mocked(prisma.auditLog.create).mockResolvedValue({
      id: "log-2",
      entityType: "Sample",
      entityId: "sample-2",
      actorId: "user-2",
      action: "stage_advanced",
      before,
      after,
      timestamp: new Date(),
    } as never);

    const result = await writeAuditLog("Sample", "sample-2", "user-2", "stage_advanced", before, after);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        entityType: "Sample",
        entityId: "sample-2",
        actorId: "user-2",
        action: "stage_advanced",
        before,
        after,
      },
    });

    expect(result.before).toEqual(before);
    expect(result.after).toEqual(after);
  });
});
