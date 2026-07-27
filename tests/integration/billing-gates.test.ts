import { describe, it, expect, beforeAll, vi } from "vitest";
import { testDb, setSession, clearSession, mockStripeInstance } from "./setup";
import {
  createTenantAndUser,
  loginAs,
  createWorkflowTemplate,
  buildRequest,
  parseResponse,
} from "./helpers";
import { POST as samplesPOST } from "../../app/api/samples/route";

describe("Billing gates", () => {
  let tenantId: string;
  let user: any;
  let templateId: string;

  beforeAll(async () => {
    // Create a tenant on Starter plan (maxSamplesPerMonth: 50)
    const t = await createTenantAndUser({
      tenantName: "Billing Test Lab",
      email: "billing@test.com",
      firebaseUid: "fb-billing",
      role: "Admin",
      planId: "plan-starter",
    });
    tenantId = t.tenant.id;
    user = t.user;

    const template = await createWorkflowTemplate(tenantId, "Billing Workflow", [
      { name: "Step 1", requiredRole: "Technician" },
    ]);
    templateId = template.id;
  });

  it("blocks registration at 51st sample (plan limit = 50)", async () => {
    await loginAs(user);

    const periodStart = new Date();
    periodStart.setDate(1);
    periodStart.setHours(0, 0, 0, 0);

    // Set usage counter to 49 (so the next one is the 50th, which is allowed)
    await testDb.usageCounter.upsert({
      where: {
        tenantId_periodStart: { tenantId, periodStart },
      },
      update: { sampleCount: 49 },
      create: { tenantId, periodStart, sampleCount: 49 },
    });

    // The 50th sample should succeed (49 + 1 = 50 <= 50)
    const req1 = buildRequest({
      body: { workflowTemplateId: templateId },
    });
    const res1 = await samplesPOST(req1 as any);
    const { status: s1 } = await parseResponse(res1);
    expect(s1).toBe(201);

    // Bump to exactly 50
    await testDb.usageCounter.update({
      where: {
        tenantId_periodStart: { tenantId, periodStart },
      },
      data: { sampleCount: 50 },
    });

    // The 51st sample should fail with 402
    const req2 = buildRequest({
      body: { workflowTemplateId: templateId },
    });
    const res2 = await samplesPOST(req2 as any);
    const { status: s2, body: b2 } = await parseResponse(res2);
    expect(s2).toBe(402);
    expect(b2.error).toMatch(/limit|sample/i);
  });

  it("processes checkout.session.completed webhook and updates plan", async () => {
    const beforeTenant = await testDb.tenant.findUnique({
      where: { id: tenantId },
    });
    expect(beforeTenant!.subscriptionStatus).toBe("active");

    const mockEvent = {
      id: "evt_test_001",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: tenantId,
          customer: "cus_test_123",
          subscription: "sub_test_456",
        },
      },
    };

    // Configure the shared mock from setup.ts
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);
    mockStripeInstance.subscriptions.retrieve.mockResolvedValue({
      items: {
        data: [{ price: { id: "price_pro_test" } }],
      },
    });

    const { POST: webhookPOST } = await import(
      "../../app/api/webhooks/stripe/route"
    );

    const req = buildRequest({
      headers: { "stripe-signature": "test-sig" },
      body: JSON.stringify(mockEvent),
    });

    const res = await webhookPOST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(200);

    const afterTenant = await testDb.tenant.findUnique({
      where: { id: tenantId },
    });
    expect(afterTenant!.stripeCustomerId).toBe("cus_test_123");
    expect(afterTenant!.subscriptionStatus).toBe("active");
    expect(afterTenant!.planId).toBe("plan-pro");

    const auditLog = await testDb.auditLog.findFirst({
      where: {
        entityType: "StripeEvent",
        entityId: "evt_test_001",
      },
    });
    expect(auditLog).not.toBeNull();
    expect(auditLog!.action).toBe("stripe.checkout.session.completed");
  });

  it("processes the same Stripe event only once (idempotency)", async () => {
    const mockEvent = {
      id: "evt_test_001",
      type: "checkout.session.completed",
      data: {
        object: {
          client_reference_id: tenantId,
          customer: "cus_test_123",
          subscription: "sub_test_456",
        },
      },
    };

    mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent);

    const { POST: webhookPOST } = await import(
      "../../app/api/webhooks/stripe/route"
    );

    const req = buildRequest({
      headers: { "stripe-signature": "test-sig" },
      body: JSON.stringify(mockEvent),
    });

    const res = await webhookPOST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(200);

    // Should still be exactly 1 audit log for this event
    const auditLogs = await testDb.auditLog.findMany({
      where: {
        entityType: "StripeEvent",
        entityId: "evt_test_001",
      },
    });
    expect(auditLogs).toHaveLength(1);
  });
});
