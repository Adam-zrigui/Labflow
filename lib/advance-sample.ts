import { prisma, type PrismaTransactionClient } from "./prisma";
import { writeAuditLog } from "./audit";
import type { Stage } from "./workflow-engine";

/**
 * Perform the database-level stage advance for a sample.
 * This is the shared core logic used by both the manual advance route
 * and the background job worker — ensuring a single path for all advances.
 *
 * This function:
 * 1. Closes the current stage history row (sets exitedAt)
 * 2. Opens a new stage history row for the next stage
 * 3. Updates the sample's currentStageIndex and status
 * 4. Writes an audit log entry (inside the same transaction)
 *
 * @returns the updated sample
 */
export async function performStageAdvance(
  sampleId: string,
  currentStageIndex: number,
  stages: Stage[],
  actorId: string
) {
  const newStageIndex = currentStageIndex + 1;
  const isLastStage = newStageIndex >= stages.length - 1;

  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    // Close the current stage history row
    const currentHistory = await tx.sampleStageHistory.findFirst({
      where: {
        sampleId,
        stageIndex: currentStageIndex,
        exitedAt: null,
      },
    });

    if (currentHistory) {
      await tx.sampleStageHistory.update({
        where: { id: currentHistory.id },
        data: { exitedAt: new Date() },
      });
    }

    // Open new stage history row
    await tx.sampleStageHistory.create({
      data: {
        sampleId,
        stageIndex: newStageIndex,
        actorId,
      },
    });

    // Update the sample
    const updated = await tx.sample.update({
      where: { id: sampleId },
      data: {
        currentStageIndex: newStageIndex,
        status: isLastStage ? "completed" : "in_progress",
      },
    });

    // Write audit log INSIDE the transaction (atomic transition per spec)
    await writeAuditLog(
      "Sample",
      sampleId,
      actorId,
      "stage_advanced",
      { previousStageIndex: currentStageIndex },
      { newStageIndex: updated.currentStageIndex }
    );

    return updated;
  });
}
