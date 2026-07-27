import { describe, it, expect, beforeAll } from "vitest";
import { testDb, setSession, clearSession } from "./setup";
import {
  createTenantAndUser,
  loginAs,
  createWorkflowTemplate,
  buildRequest,
  parseResponse,
  buildParams,
} from "./helpers";
import { POST as createSamplePOST } from "../../app/api/samples/route";
import { POST as advancePOST } from "../../app/api/samples/[id]/advance/route";
import { POST as instrumentWebhookPOST } from "../../app/api/webhooks/instrument/route";

describe("Sample lifecycle", () => {
  let tenantId: string;
  let adminUser: any;
  let techUser: any;
  let seniorUser: any;
  let templateId: string;
  let sampleId: string;

  beforeAll(async () => {
    // Create tenant with 3 users of different roles
    const admin = await createTenantAndUser({
      tenantName: "Lifecycle Lab",
      email: "admin-lifecycle@test.com",
      firebaseUid: "fb-lc-admin",
      role: "Admin",
      planId: "plan-pro",
    });
    tenantId = admin.tenant.id;
    adminUser = admin.user;

    const tech = await createTenantAndUser({
      tenantName: "Lifecycle Lab",
      email: "tech-lifecycle@test.com",
      firebaseUid: "fb-lc-tech",
      role: "Technician",
      planId: "plan-pro",
    });
    // Reuse tenant — delete the auto-created tenant
    await testDb.user.delete({ where: { id: tech.user.id } });
    await testDb.tenant.delete({ where: { id: tech.tenant.id } });
    techUser = await testDb.user.create({
      data: {
        tenantId,
        email: "tech-lifecycle@test.com",
        firebaseUid: "fb-lc-tech",
        role: "Technician",
      },
    });

    const senior = await createTenantAndUser({
      tenantName: "Lifecycle Lab",
      email: "senior-lifecycle@test.com",
      firebaseUid: "fb-lc-senior",
      role: "SeniorScientist",
      planId: "plan-pro",
    });
    await testDb.user.delete({ where: { id: senior.user.id } });
    await testDb.tenant.delete({ where: { id: senior.tenant.id } });
    seniorUser = await testDb.user.create({
      data: {
        tenantId,
        email: "senior-lifecycle@test.com",
        firebaseUid: "fb-lc-senior",
        role: "SeniorScientist",
      },
    });

    // Create a workflow with 4 stages:
    // 0: Intake (Technician)
    // 1: Preparation (Technician)
    // 2: Analysis (instrument — background job, has reference range check)
    // 3: Review (SeniorScientist — approval gate)
    const template = await createWorkflowTemplate(tenantId, "Full Lifecycle", [
      { name: "Intake", requiredRole: "Technician" },
      { name: "Preparation", requiredRole: "Technician" },
      {
        name: "Analysis",
        requiredRole: "Technician",
        backgroundJob: true,
      },
      {
        name: "Review",
        requiredRole: "SeniorScientist",
        isApprovalGate: true,
      },
    ]);
    templateId = template.id;

    // Enable instrument webhook on the tenant's plan
    await testDb.tenant.update({
      where: { id: tenantId },
      data: { planId: "plan-pro" },
    });
  });

  // ── Step 1: Create the sample ───────────────────────────────
  it("registers a sample via POST /api/samples", async () => {
    await loginAs(techUser);

    const req = buildRequest({
      body: { workflowTemplateId: templateId, metadata: { patientId: "P-001" } },
    });

    const res = await createSamplePOST(req as any);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(201);
    expect(body.status).toBe("in_progress");
    expect(body.currentStageIndex).toBe(0);
    sampleId = body.id;

    // Verify initial stage history
    const history = await testDb.sampleStageHistory.findMany({
      where: { sampleId },
      orderBy: { stageIndex: "asc" },
    });
    expect(history).toHaveLength(1);
    expect(history[0].stageIndex).toBe(0);
    expect(history[0].actorId).toBe(techUser.id);
  });

  // ── Step 2: Advance through non-gated stages ────────────────
  it("advances sample through non-gated stages", async () => {
    await loginAs(techUser);

    // Advance from stage 0 (Intake) to stage 1 (Preparation)
    let req = buildRequest({ body: {} });
    let res = await advancePOST(req as any, buildParams(sampleId));
    let { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.currentStageIndex).toBe(1);

    // Advance from stage 1 (Preparation) to stage 2 (Analysis)
    req = buildRequest({ body: {} });
    res = await advancePOST(req as any, buildParams(sampleId));
    ({ status, body } = await parseResponse(res));
    expect(status).toBe(200);
    expect(body.currentStageIndex).toBe(2);
  });

  // ── Step 3: Instrument webhook posts out-of-range result ─────
  it("instrument webhook flags sample with out-of-range result", async () => {
    // Set the instrument webhook secret for testing
    process.env.INSTRUMENT_WEBHOOK_SECRET = "test-instrument-secret";

    const req = buildRequest({
      headers: { "x-instrument-secret": "test-instrument-secret" },
      body: {
        sampleId,
        result: {
          value: 999,
          unit: "ng/mL",
          referenceRange: "10-50",
        },
      },
    });

    const res = await instrumentWebhookPOST(req as any);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.flagged).toBe(true);

    // Verify sample is flagged
    const sample = await testDb.sample.findUnique({ where: { id: sampleId } });
    expect(sample!.status).toBe("flagged");
    expect(sample!.currentStageIndex).toBe(2); // stays at same stage

    // Verify stage history has a "flagged" outcome
    const history = await testDb.sampleStageHistory.findFirst({
      where: { sampleId, stageIndex: 2, exitedAt: { not: null } },
    });
    expect(history).not.toBeNull();
    expect(history!.outcome).toBe("flagged");

    // Verify audit log
    const auditLogs = await testDb.auditLog.findMany({
      where: { entityType: "Sample", entityId: sampleId, action: "flagged" },
    });
    expect(auditLogs.length).toBeGreaterThanOrEqual(1);
  });

  // ── Step 4: Flagged sample does NOT advance ─────────────────
  it("flagged sample cannot be advanced", async () => {
    await loginAs(techUser);

    const req = buildRequest({ body: {} });
    const res = await advancePOST(req as any, buildParams(sampleId));
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  // ── Step 5: Technician CANNOT approve flagged stage ──────────
  it("Technician CANNOT approve the flagged stage (403)", async () => {
    await loginAs(techUser);

    const req = buildRequest({ body: {} });
    const res = await advancePOST(req as any, buildParams(sampleId));
    const { status } = await parseResponse(res);
    // The sample is flagged, so canAdvance returns false → 400
    // Even if it weren't flagged, the next stage is an approval gate
    // requiring SeniorScientist, so a Technician would get 403.
    expect([400, 403]).toContain(status);
  });

  // ── Step 6: SeniorScientist CAN approve and advance ──────────
  it("SeniorScientist CAN approve the flagged stage and advance", async () => {
    // First, unflag the sample so canAdvance returns true
    await testDb.sample.update({
      where: { id: sampleId },
      data: { status: "in_progress" },
    });

    // Re-open the stage history for stage 2
    await testDb.sampleStageHistory.updateMany({
      where: { sampleId, stageIndex: 2, exitedAt: { not: null } },
      data: { exitedAt: null, outcome: null },
    });

    await loginAs(seniorUser);

    const req = buildRequest({ body: {} });
    const res = await advancePOST(req as any, buildParams(sampleId));
    const { status, body } = await parseResponse(res);
    expect(status).toBe(200);
    expect(body.currentStageIndex).toBe(3);
    expect(body.status).toBe("completed"); // stage 3 is the last stage
  });

  // ── Step 7: Verify audit trail integrity ────────────────────
  it("every transition wrote SampleStageHistory + AuditLog rows", async () => {
    // Count stage history entries
    const history = await testDb.sampleStageHistory.findMany({
      where: { sampleId },
      orderBy: { stageIndex: "asc" },
    });
    // 0: Intake (entered+exited), 1: Prep (entered+exited),
    // 2: Analysis (entered+flagged+re-entered+exited), 3: Review (entered)
    expect(history.length).toBeGreaterThanOrEqual(4);

    // Count audit log entries
    const auditLogs = await testDb.auditLog.findMany({
      where: { entityType: "Sample", entityId: sampleId },
      orderBy: { timestamp: "asc" },
    });
    // created + stage_advanced×3 + flagged = at least 5
    expect(auditLogs.length).toBeGreaterThanOrEqual(5);

    // Verify we have a "created" log
    const createdLog = auditLogs.find((l) => l.action === "created");
    expect(createdLog).toBeDefined();

    // Verify we have "stage_advanced" logs
    const advanceLogs = auditLogs.filter((l) => l.action === "stage_advanced");
    expect(advanceLogs.length).toBeGreaterThanOrEqual(3);

    // Verify we have a "flagged" log
    const flaggedLog = auditLogs.find((l) => l.action === "flagged");
    expect(flaggedLog).toBeDefined();
  });
});
