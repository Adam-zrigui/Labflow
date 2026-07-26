import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { canUseInstrumentWebhook } from "@/lib/feature-gate";

const instrumentResultSchema = z.object({
  value: z.number(),
  unit: z.string(),
  referenceRange: z.string().optional(),
});

const instrumentWebhookSchema = z.object({
  sampleId: z.string().uuid(),
  result: instrumentResultSchema,
});

export async function POST(request: NextRequest) {
  // Authenticate via shared secret header
  const secret = request.headers.get("x-instrument-secret");
  const expectedSecret = process.env.INSTRUMENT_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = instrumentWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { sampleId, result } = parsed.data;

  // Look up sample and its tenant
  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: {
      tenant: {
        select: { planId: true },
      },
      template: {
        select: { stages: true },
      },
    },
  });

  if (!sample) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  }

  // Feature gate: tenant's plan must support instrument webhooks
  const hasWebhook = await canUseInstrumentWebhook(sample.tenantId);
  if (!hasWebhook) {
    return NextResponse.json(
      { error: "Instrument webhooks not available on current plan" },
      { status: 403 }
    );
  }

  // Determine if result is in range (simplified: if referenceRange is present, check)
  const inRange = result.referenceRange
    ? isInRange(result.value, result.referenceRange)
    : true;

  if (inRange) {
    // Attach result to sample metadata, advance stage
    const stages = sample.template.stages as Array<{
      name: string;
      requiredRole: string;
    }>;

    const nextStageIndex = sample.currentStageIndex + 1;
    const isLastStage = nextStageIndex >= stages.length - 1;

    await prisma.$transaction(async (tx) => {
      // Close current stage history
      const currentHistory = await tx.sampleStageHistory.findFirst({
        where: {
          sampleId,
          stageIndex: sample.currentStageIndex,
          exitedAt: null,
        },
      });

      if (currentHistory) {
        await tx.sampleStageHistory.update({
          where: { id: currentHistory.id },
          data: { exitedAt: new Date(), outcome: "pass" },
        });
      }

      // Open next stage
      await tx.sampleStageHistory.create({
        data: {
          sampleId,
          stageIndex: nextStageIndex,
          actorId: "instrument-webhook",
        },
      });

      // Update sample
      await tx.sample.update({
        where: { id: sampleId },
        data: {
          currentStageIndex: nextStageIndex,
          status: isLastStage ? "completed" : "in_progress",
          metadata: {
            ...((sample.metadata as Record<string, unknown>) ?? {}),
            instrumentResult: result,
          },
        },
      });
    });

    await writeAuditLog(
      "Sample",
      sampleId,
      "instrument-webhook",
      "stage_advanced",
      { inRange: true },
      { result }
    );

    return NextResponse.json({ success: true });
  } else {
    // Out of range: flag the sample, do not advance
    await prisma.sample.update({
      where: { id: sampleId },
      data: {
        status: "flagged",
        metadata: {
          ...((sample.metadata as Record<string, unknown>) ?? {}),
          instrumentResult: result,
          flagReason: `Result ${result.value} ${result.unit} is out of range`,
        },
      },
    });

    // Close current stage with flagged outcome
    const currentHistory = await prisma.sampleStageHistory.findFirst({
      where: {
        sampleId,
        stageIndex: sample.currentStageIndex,
        exitedAt: null,
      },
    });

    if (currentHistory) {
      await prisma.sampleStageHistory.update({
        where: { id: currentHistory.id },
        data: { exitedAt: new Date(), outcome: "flagged" },
      });
    }

    await writeAuditLog(
      "Sample",
      sampleId,
      "instrument-webhook",
      "flagged",
      { inRange: false },
      { result, reason: "Out of reference range" }
    );

    return NextResponse.json({ success: true, flagged: true });
  }
}

function isInRange(value: number, referenceRange: string): boolean {
  // Parse ranges like "3.5-5.5" or "<10" or ">5"
  const trimmed = referenceRange.trim();

  if (trimmed.startsWith("<")) {
    const max = parseFloat(trimmed.slice(1));
    return value < max;
  }

  if (trimmed.startsWith(">")) {
    const min = parseFloat(trimmed.slice(1));
    return value > min;
  }

  const match = trimmed.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/);
  if (match) {
    const min = parseFloat(match[1]);
    const max = parseFloat(match[2]);
    return value >= min && value <= max;
  }

  // If we can't parse the range, assume in range
  return true;
}
