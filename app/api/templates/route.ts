import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { requireRole } from "@/lib/require-role";
import { canCreateTemplate } from "@/lib/feature-gate";

const stageSchema = z.object({
  name: z.string().min(1),
  requiredRole: z.string().min(1),
  requiredFields: z.array(z.string()).optional(),
  isApprovalGate: z.boolean().optional(),
  backgroundJob: z.boolean().optional(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  stages: z.array(stageSchema).min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  // Admin-only
  const roleCheck = requireRole(session, ["Admin"]);
  if (roleCheck) return roleCheck;

  // Feature gate: plan limit
  const gate = await canCreateTemplate(session.tenantId);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.reason ?? "Template creation blocked" },
      { status: 402 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, stages } = parsed.data;

  const template = await prisma.workflowTemplate.create({
    data: {
      tenantId: session.tenantId,
      name,
      stages: stages as never,
    },
  });

  return NextResponse.json(template, { status: 201 });
}

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const templates = await prisma.workflowTemplate.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}
