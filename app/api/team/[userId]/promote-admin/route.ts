import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { requireRole } from "@/lib/require-role";
import { writeAuditLog } from "@/lib/audit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const roleCheck = requireRole(session, ["Admin"]);
  if (roleCheck) return roleCheck;

  const { userId } = await params;

  if (session.userId === userId) {
    return NextResponse.json(
      { error: "Cannot change your own role" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true, role: true, email: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (targetUser.role === "Admin") {
    return NextResponse.json(
      { error: "User is already an Admin" },
      { status: 400 }
    );
  }

  const before = { role: targetUser.role };

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: "Admin" },
    select: { id: true, role: true },
  });

  const after = { role: updatedUser.role };

  await writeAuditLog(
    "User",
    userId,
    session.userId,
    "role_escalated_to_admin",
    before,
    after
  );

  return NextResponse.json({
    user: {
      id: updatedUser.id,
      role: updatedUser.role,
    },
  });
}
