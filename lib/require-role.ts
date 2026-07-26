import { NextResponse } from "next/server";
import type { Session } from "./auth";

/**
 * Check that the session's role is among the allowed roles.
 * Returns null if allowed, or a 403 NextResponse if denied.
 */
export function requireRole(
  session: Session | null,
  allowedRoles: string[]
): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json(
      {
        error: `This action requires one of these roles: ${allowedRoles.join(", ")}`,
      },
      { status: 403 }
    );
  }

  return null;
}
