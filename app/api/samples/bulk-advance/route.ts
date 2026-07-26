import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import {
  getNextStage,
  canAdvance,
  isApprovalGate,
  type Stage,
} from "@/lib/workflow-engine";
import { performStageAdvance } from "@/lib/advance-sample";
import { requireRole } from "@/lib/require-role";

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sampleIds } = body as { sampleIds?: unknown };
  if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
    return NextResponse.json(
      { error: "sampleIds must be a non-empty array" },
      { status: 400 }
    );
  }

  if (sampleIds.length > 50) {
    return NextResponse.json(
      { error: "Cannot advance more than 50 samples at once" },
      { status: 400 }
    );
  }

  const succeeded: string[] = [];
  const failed: { id: string; reason: string }[] = [];

  for (const rawId of sampleIds) {
    if (typeof rawId !== "string") {
      failed.push({ id: String(rawId), reason: "Invalid ID format" });
      continue;
    }

    try {
      const sample = await prisma.sample.findUnique({
        where: { id: rawId },
        include: { template: { select: { stages: true } } },
      });

      if (!sample || sample.tenantId !== session.tenantId) {
        failed.push({ id: rawId, reason: "Sample not found" });
        continue;
      }

      const stages = sample.template.stages as unknown as Stage[];
      const nextStage = getNextStage(stages, sample.currentStageIndex);

      if (!canAdvance(sample.currentStageIndex, stages.length, sample.status)) {
        failed.push({ id: rawId, reason: "Sample cannot be advanced from its current state" });
        continue;
      }

      if (isApprovalGate(nextStage)) {
        const roleCheck = requireRole(session, [nextStage!.requiredRole]);
        if (roleCheck) {
          failed.push({ id: rawId, reason: `Role required: ${nextStage!.requiredRole}` });
          continue;
        }
      }

      await performStageAdvance(rawId, sample.currentStageIndex, stages, session.userId);
      succeeded.push(rawId);
    } catch (err) {
      failed.push({
        id: rawId,
        reason: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ succeeded, failed });
}
