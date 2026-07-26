import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { requireRole } from "@/lib/require-role";

const stageSchema = z.object({
  name: z.string().min(1),
  requiredRole: z.string().min(1),
  requiredFields: z.array(z.string()).optional(),
  isApprovalGate: z.boolean().optional(),
  backgroundJob: z.boolean().optional(),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  stages: z.array(stageSchema).min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  // Admin-only
  const roleCheck = requireRole(session, ["Admin"]);
  if (roleCheck) return roleCheck;

  const { id } = await params;

  // Load and confirm ownership
  const template = await prisma.workflowTemplate.findUnique({
    where: { id },
    select: { id: true, tenantId: true },
  });

  if (!template || template.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.stages !== undefined)
    updateData.stages = parsed.data.stages as unknown as never[];

  const updated = await prisma.workflowTemplate.update({
    where: { id },
    data: updateData as never,
  });

  return NextResponse.json(updated);
}
