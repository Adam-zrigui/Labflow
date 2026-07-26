import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { clearSessionCookie } from "@/lib/auth";

export async function DELETE() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  // Fetch current user for audit before snapshot
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, firebaseUid: true, role: true, tenantId: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const pseudonymizedEmail = `deleted-${randomUUID()}@removed.local`;
  const before = { email: user.email, role: user.role, deletedAt: null };

  await prisma.$transaction(async (tx) => {
    // Pseudonymize — replace email, set deletedAt
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: pseudonymizedEmail,
        deletedAt: new Date(),
      },
    });

    // Log the deletion itself
    await writeAuditLog(
      "User",
      user.id,
      user.id,
      "account_deletion_requested",
      before,
      { email: pseudonymizedEmail, deletedAt: new Date().toISOString() }
    );
  });

  // Clear the session cookie
  const res = await clearSessionCookie();
  return NextResponse.json(
    { message: "Account deleted. Your data has been pseudonymized." },
    { status: 200, headers: res.headers }
  );
}
