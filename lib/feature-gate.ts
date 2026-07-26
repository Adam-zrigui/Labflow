import { prisma } from "./prisma";
import { startOfMonth } from "date-fns";

export interface GateResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if the tenant can register a new sample this billing period.
 * Returns 402-relevant response when blocked.
 */
export async function canRegisterSample(tenantId: string): Promise<GateResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true, usage: true },
  });

  if (!tenant) return { allowed: false, reason: "Tenant not found" };
  if (!tenant.plan) return { allowed: false, reason: "No active plan" };

  if (
    tenant.subscriptionStatus === "past_due" ||
    tenant.subscriptionStatus === "canceled"
  ) {
    return { allowed: false, reason: "Subscription is not active" };
  }

  const periodStart = startOfMonth(new Date());
  const currentUsage = tenant.usage.find(
    (u) => u.periodStart.getTime() === periodStart.getTime()
  );

  if (currentUsage && currentUsage.sampleCount >= tenant.plan.maxSamplesPerMonth) {
    return {
      allowed: false,
      reason: "Monthly sample limit reached",
    };
  }

  return { allowed: true };
}

/**
 * Check if the tenant's plan allows instrument webhooks.
 */
export async function canUseInstrumentWebhook(tenantId: string): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  return tenant?.plan?.hasInstrumentWebhook === true;
}

/**
 * Check if the tenant can create more workflow templates.
 */
export async function canCreateTemplate(tenantId: string): Promise<GateResult> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { plan: true },
  });

  if (!tenant) return { allowed: false, reason: "Tenant not found" };
  if (!tenant.plan) return { allowed: false, reason: "No active plan" };

  const templateCount = await prisma.workflowTemplate.count({
    where: { tenantId },
  });

  if (templateCount >= tenant.plan.maxWorkflowTemplates) {
    return { allowed: false, reason: "Workflow template limit reached" };
  }

  return { allowed: true };
}
