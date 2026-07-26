import { describe, it, expect } from "vitest";
import { requireRole } from "@/lib/require-role";
import type { Session } from "@/lib/auth";

const adminSession: Session = {
  userId: "user-1",
  tenantId: "tenant-1",
  role: "Admin",
  firebaseUid: "firebase-uid-1",
};

const techSession: Session = {
  userId: "user-2",
  tenantId: "tenant-1",
  role: "Technician",
  firebaseUid: "firebase-uid-2",
};

describe("requireRole", () => {
  it("returns null when session role is in allowed roles", () => {
    const result = requireRole(adminSession, ["Admin", "SeniorScientist"]);
    expect(result).toBeNull();
  });

  it("returns a 403 response when session role is not allowed", () => {
    const result = requireRole(techSession, ["Admin", "SeniorScientist"]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns a 401 response when session is null", () => {
    const result = requireRole(null, ["Admin"]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("returns null when allowed roles contains the exact role", () => {
    const result = requireRole(techSession, ["Technician", "Admin"]);
    expect(result).toBeNull();
  });
});
