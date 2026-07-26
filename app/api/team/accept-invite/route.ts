import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionCookie } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

const acceptSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
  firebaseUid: z.string().min(1, "Firebase UID is required"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, firebaseUid } = parsed.data;

  const invite = await prisma.inviteToken.findUnique({
    where: { token },
  });

  if (!invite) {
    return NextResponse.json(
      { error: "Invalid or expired invite" },
      { status: 404 }
    );
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { error: "This invite has already been used" },
      { status: 410 }
    );
  }

  if (new Date() > invite.expiresAt) {
    return NextResponse.json(
      { error: "This invite has expired" },
      { status: 410 }
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { firebaseUid },
        { email: invite.email },
      ],
    },
    select: { id: true, tenantId: true, role: true, email: true, firebaseUid: true },
  });

  if (existingUser) {
    if (existingUser.tenantId === invite.tenantId) {
      const response = await createSessionCookie({
        firebaseUid: existingUser.firebaseUid,
        userId: existingUser.id,
        tenantId: existingUser.tenantId,
        role: existingUser.role,
        email: existingUser.email,
      });
      return response;
    }
    return NextResponse.json(
      { error: "This email is already associated with another workspace" },
      { status: 409 }
    );
  }

  const { user } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        tenantId: invite.tenantId,
        email: invite.email,
        firebaseUid,
        role: invite.role,
      },
    });

    await tx.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    });

    return { user };
  });

  await writeAuditLog("User", user.id, user.id, "joined_via_invite", null, {
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });

  const response = await createSessionCookie({
    firebaseUid,
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
  });

  return response;
}
