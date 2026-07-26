import { describe, it, expect } from "vitest";
import {
  getCurrentStage,
  getNextStage,
  canAdvance,
  isApprovalGate,
  isBackgroundJob,
  type Stage,
} from "@/lib/workflow-engine";

const mockStages: Stage[] = [
  { name: "Sample Receipt", requiredRole: "Technician" },
  { name: "DNA Extraction", requiredRole: "Technician" },
  {
    name: "QC Review",
    requiredRole: "SeniorScientist",
    isApprovalGate: true,
  },
  { name: "Sequencing", requiredRole: "Technician", backgroundJob: true },
  { name: "Report", requiredRole: "SeniorScientist" },
];

describe("getCurrentStage", () => {
  it("returns the stage at the given index", () => {
    const stage = getCurrentStage(mockStages, 0);
    expect(stage?.name).toBe("Sample Receipt");
  });

  it("returns null for out-of-bounds index", () => {
    const stage = getCurrentStage(mockStages, 99);
    expect(stage).toBeNull();
  });
});

describe("getNextStage", () => {
  it("returns the next stage", () => {
    const stage = getNextStage(mockStages, 0);
    expect(stage?.name).toBe("DNA Extraction");
  });

  it("returns null when on the last stage", () => {
    const stage = getNextStage(mockStages, 4);
    expect(stage).toBeNull();
  });
});

describe("canAdvance", () => {
  it("returns true for in-progress sample not on last stage", () => {
    expect(canAdvance(0, mockStages.length, "in_progress")).toBe(true);
  });

  it("returns false for completed samples", () => {
    expect(canAdvance(2, mockStages.length, "completed")).toBe(false);
  });

  it("returns false for flagged samples", () => {
    expect(canAdvance(2, mockStages.length, "flagged")).toBe(false);
  });

  it("returns false when on the last stage", () => {
    expect(canAdvance(4, mockStages.length, "in_progress")).toBe(false);
  });
});

describe("isApprovalGate", () => {
  it("returns true for approval gate stages", () => {
    const stage = mockStages[2];
    expect(isApprovalGate(stage)).toBe(true);
  });

  it("returns false for non-approval gate stages", () => {
    const stage = mockStages[0];
    expect(isApprovalGate(stage)).toBe(false);
  });

  it("returns false for null stage", () => {
    expect(isApprovalGate(null)).toBe(false);
  });
});

describe("isBackgroundJob", () => {
  it("returns true for background job stages", () => {
    const stage = mockStages[3];
    expect(isBackgroundJob(stage)).toBe(true);
  });

  it("returns false for regular stages", () => {
    const stage = mockStages[0];
    expect(isBackgroundJob(stage)).toBe(false);
  });

  it("returns false for null stage", () => {
    expect(isBackgroundJob(null)).toBe(false);
  });
});
