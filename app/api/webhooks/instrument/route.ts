import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { canUseInstrumentWebhook } from "@/lib/feature-gate";
import { sendFlagNotifications } from "@/lib/notify-flag";
import { checkRateLimit } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
  const { success } = await checkRateLimit(`webhook:${ip}`);

  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts, please try again in a minute" },
      { status: 429 }
    );
  }

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

  try {
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

    const hasWebhook = await canUseInstrumentWebhook(sample.tenantId);
    if (!hasWebhook) {
      return NextResponse.json(
        { error: "Instrument webhooks not available on current plan" },
        { status: 403 }
      );
    }

    const inRange = result.referenceRange
      ? isInRange(result.value, result.referenceRange)
      : true;

    if (inRange) {
      const stages = sample.template.stages as Array<{
        name: string;
        requiredRole: string;
      }>;

      const nextStageIndex = sample.currentStageIndex + 1;
      const isLastStage = nextStageIndex >= stages.length - 1;

      await prisma.$transaction(async (tx) => {
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

        await tx.sampleStageHistory.create({
          data: {
            sampleId,
            stageIndex: nextStageIndex,
            actorId: "instrument-webhook",
          },
        });

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

      const templateName = (sample.template as { name?: string })?.name ?? "Unknown";
      sendFlagNotifications(sample.tenantId, sampleId, templateName).catch(() => {});

      return NextResponse.json({ success: true, flagged: true });
    }
  } catch (error) {
    console.error("Instrument webhook error:", error);
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function isInRange(value: number, referenceRange: string): boolean {
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

  return true;
}
