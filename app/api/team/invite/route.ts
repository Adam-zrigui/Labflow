import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { requireRole } from "@/lib/require-role";
import { canInviteUser } from "@/lib/feature-gate";
import { writeAuditLog } from "@/lib/audit";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["Technician", "SeniorScientist"], {
    error: "Role must be Technician or SeniorScientist",
  }),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const roleCheck = requireRole(session, ["Admin"]);
  if (roleCheck) return roleCheck;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;

  const gate = await canInviteUser(session.tenantId);
  if (!gate.allowed) {
    return NextResponse.json({ error: gate.reason }, { status: 402 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "A user with this email already exists" },
      { status: 409 }
    );
  }

  const pendingInvite = await prisma.inviteToken.findFirst({
    where: {
      email,
      tenantId: session.tenantId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (pendingInvite) {
    return NextResponse.json(
      { error: "An active invite already exists for this email" },
      { status: 409 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invite = await prisma.inviteToken.create({
    data: {
      tenantId: session.tenantId,
      email,
      role,
      token,
      expiresAt,
    },
  });

  await writeAuditLog("Tenant", session.tenantId, session.userId, "user_invited", null, {
    email,
    role,
    inviteId: invite.id,
  });

  const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/signup?invite=${token}`;

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      signupUrl,
    },
  }, { status: 201 });
}
