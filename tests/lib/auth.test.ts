import { describe, it, expect } from "vitest";
import { requireRole } from "@/lib/require-role";
import type { Session } from "@/lib/auth";

describe("requireRole", () => {
  it("returns null for Admin accessing admin route", () => {
    const session: Session = {
      userId: "u1",
      tenantId: "t1",
      role: "Admin",
      firebaseUid: "f1",
    };
    const result = requireRole(session, ["Admin"]);
    expect(result).toBeNull();
  });

  it("returns 403 for Technician accessing admin route", () => {
    const session: Session = {
      userId: "u2",
      tenantId: "t1",
      role: "Technician",
      firebaseUid: "f2",
    };
    const result = requireRole(session, ["Admin"]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
  });

  it("returns 401 for null session", () => {
    const result = requireRole(null, ["Admin"]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it("allows multiple roles in the allowed list", () => {
    const session: Session = {
      userId: "u3",
      tenantId: "t1",
      role: "SeniorScientist",
      firebaseUid: "f3",
    };
    const result = requireRole(session, ["SeniorScientist", "Admin"]);
    expect(result).toBeNull();
  });
});
