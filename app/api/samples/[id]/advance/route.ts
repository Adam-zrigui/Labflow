import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { requireRole } from "@/lib/require-role";
import {
  getNextStage,
  canAdvance,
  isApprovalGate,
  isBackgroundJob,
  type Stage,
} from "@/lib/workflow-engine";
import { performStageAdvance } from "@/lib/advance-sample";
import { enqueueSequencingJob } from "@/lib/queue";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

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

  // Perform the stage transition via the shared core logic
  const updatedSample = await performStageAdvance(
    id,
    sample.currentStageIndex,
    stages,
    session.userId
  );

  // If the next stage is flagged as a background job, enqueue it
  if (isBackgroundJob(nextStage)) {
    await enqueueSequencingJob(id);
  }

  return NextResponse.json(updatedSample);
}
