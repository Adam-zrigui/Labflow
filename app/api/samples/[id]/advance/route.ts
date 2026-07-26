import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PrismaTransactionClient } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireRole } from "@/lib/require-role";
import {
  getNextStage,
  canAdvance,
  isApprovalGate,
  isBackgroundJob,
  type Stage,
} from "@/lib/workflow-engine";
import { writeAuditLog } from "@/lib/audit";
import { enqueueSequencingJob } from "@/lib/queue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  const { id } = await params;

  // Load the sample and confirm tenant match
  const sample = await prisma.sample.findUnique({
    where: { id },
    include: {
      template: {
        select: { stages: true },
      },
    },
  });

  if (!sample || sample.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  }

  const stages = sample.template.stages as unknown as Stage[];
  const nextStage = getNextStage(stages, sample.currentStageIndex);

  if (!canAdvance(sample.currentStageIndex, stages.length, sample.status)) {
    return NextResponse.json(
      { error: "Sample cannot be advanced from its current state" },
      { status: 400 }
    );
  }

  // If the next stage is an approval gate, enforce role check
  if (isApprovalGate(nextStage)) {
    const roleCheck = requireRole(session, [nextStage!.requiredRole]);
    if (roleCheck) {
      return roleCheck; // 403 with clear message
    }
  }

  // Perform the stage transition in a transaction (including audit log)
  const updatedSample = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
    // Close the current stage history row
    const currentHistory = await tx.sampleStageHistory.findFirst({
      where: {
        sampleId: id,
        stageIndex: sample.currentStageIndex,
        exitedAt: null,
      },
    });

    if (currentHistory) {
      await tx.sampleStageHistory.update({
        where: { id: currentHistory.id },
        data: { exitedAt: new Date() },
      });
    }

    const newStageIndex = sample.currentStageIndex + 1;
    const isLastStage = newStageIndex >= stages.length - 1;

    // Open new stage history row
    await tx.sampleStageHistory.create({
      data: {
        sampleId: id,
        stageIndex: newStageIndex,
        actorId: session.userId,
      },
    });

    // Update the sample
    const updated = await tx.sample.update({
      where: { id },
      data: {
        currentStageIndex: newStageIndex,
        status: isLastStage ? "completed" : "in_progress",
      },
    });

    // Write audit log INSIDE the transaction (atomic transition per spec)
    await writeAuditLog(
      "Sample",
      id,
      session.userId,
      "stage_advanced",
      { previousStageIndex: sample.currentStageIndex },
      { newStageIndex: updated.currentStageIndex }
    );

    return updated;
  });

  // If the next stage is flagged as a background job, enqueue it
  if (isBackgroundJob(nextStage)) {
    await enqueueSequencingJob(id);
  }

  return NextResponse.json(updatedSample);
}
