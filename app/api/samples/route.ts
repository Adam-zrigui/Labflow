import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { PrismaTransactionClient } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { canRegisterSample } from "@/lib/feature-gate";

const createSampleSchema = z.object({
  workflowTemplateId: z.string().uuid(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  // Feature gate: check plan limits
  const gate = await canRegisterSample(session.tenantId);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.reason ?? "Sample registration blocked" },
      { status: 402 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSampleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { workflowTemplateId, metadata } = parsed.data;

  // Confirm workflow template belongs to this tenant
  const template = await prisma.workflowTemplate.findUnique({
    where: { id: workflowTemplateId },
    select: { tenantId: true, stages: true },
  });

  if (!template || template.tenantId !== session.tenantId) {
    return NextResponse.json(
      { error: "Workflow template not found" },
      { status: 403 }
    );
  }

  // Create the sample, its first stage history, and increment usage in a transaction
  const sample = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const newSample = await tx.sample.create({
      data: {
        tenantId: session.tenantId,
        workflowTemplateId,
        currentStageIndex: 0,
        status: "in_progress",
        metadata: metadata as never,
      },
    });

    // Create initial stage history entry
    await tx.sampleStageHistory.create({
      data: {
        sampleId: newSample.id,
        stageIndex: 0,
        actorId: session.userId,
      },
    });

    // Increment usage counter for this month
    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    await tx.usageCounter.upsert({
      where: {
        tenantId_periodStart: {
          tenantId: session.tenantId,
          periodStart,
        },
      },
      update: {
        sampleCount: { increment: 1 },
      },
      create: {
        tenantId: session.tenantId,
        periodStart,
        sampleCount: 1,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return newSample;
  });

  // Audit log
  await writeAuditLog(
    "Sample",
    sample.id,
    session.userId,
    "created",
    null,
    { workflowTemplateId, metadata } as never
  );

  return NextResponse.json(sample, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const statusFilter =
    status && ["in_progress", "flagged", "completed"].includes(status)
      ? { status }
      : {};

  const samples = await prisma.sample.findMany({
    where: {
      tenantId: session.tenantId,
      ...statusFilter,
    },
    orderBy: { createdAt: "desc" },
    include: {
      template: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(samples);
}
