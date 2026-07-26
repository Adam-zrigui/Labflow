export interface Stage {
  name: string;
  requiredRole: string;
  requiredFields?: string[];
  isApprovalGate?: boolean;
  backgroundJob?: boolean;
}

export function getCurrentStage(stages: Stage[], currentStageIndex: number): Stage | null {
  return stages[currentStageIndex] ?? null;
}

export function getNextStage(stages: Stage[], currentStageIndex: number): Stage | null {
  return stages[currentStageIndex + 1] ?? null;
}

/**
 * Can the sample advance from its current stage to the next?
 * - completed / flagged samples cannot advance
 * - must have a next stage defined
 */
export function canAdvance(
  currentStageIndex: number,
  totalStages: number,
  status: string
): boolean {
  if (status === "completed" || status === "flagged") {
    return false;
  }
  return currentStageIndex < totalStages - 1;
}

export function isApprovalGate(stage: Stage | null): boolean {
  return stage?.isApprovalGate === true;
}

export function isBackgroundJob(stage: Stage | null): boolean {
  return stage?.backgroundJob === true;
}
