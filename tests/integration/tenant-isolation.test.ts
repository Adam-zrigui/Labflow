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

describe("Tenant isolation", () => {
  let tenantA: any;
  let userA: any;
  let sampleA: any;
  let templateA: any;

  let tenantB: any;
  let userB: any;
  let sampleB: any;
  let templateB: any;

  beforeAll(async () => {
    // ── Tenant A ──────────────────────────────────────────────
    const a = await createTenantAndUser({
      tenantName: "Tenant Alpha",
      email: "admin-alpha@test.com",
      firebaseUid: "fb-alpha",
      role: "Admin",
      planId: "plan-pro",
    });
    tenantA = a.tenant;
    userA = a.user;

    templateA = await createWorkflowTemplate(tenantA.id, "Alpha Workflow", [
      { name: "Step 1", requiredRole: "Technician" },
      { name: "Step 2", requiredRole: "Technician" },
    ]);

    sampleA = await createSample(tenantA.id, templateA.id);

    // ── Tenant B ──────────────────────────────────────────────
    const b = await createTenantAndUser({
      tenantName: "Tenant Beta",
      email: "admin-beta@test.com",
      firebaseUid: "fb-beta",
      role: "Admin",
      planId: "plan-pro",
    });
    tenantB = b.tenant;
    userB = b.user;

    templateB = await createWorkflowTemplate(tenantB.id, "Beta Workflow", [
      { name: "Step 1", requiredRole: "Technician" },
    ]);

    sampleB = await createSample(tenantB.id, templateB.id);
  });

  // ── THE most important test ─────────────────────────────────
  it("Tenant A user gets 404 (not 403) when requesting Tenant B's sample by ID", async () => {
    await loginAs(userA);

    const { GET: sampleGET } = await import(
      "../../app/api/samples/[id]/route"
    );
    const req = buildRequest({ method: "GET" });
    const res = await sampleGET(req as any, buildParams(sampleB.id));
    const { status } = await parseResponse(res);

    // 404 — not 403. Must not leak existence of the sample.
    expect(status).toBe(404);
  });

  // ── Listing never returns cross-tenant data ─────────────────
  it("GET /api/samples for Tenant A never returns any of Tenant B's samples", async () => {
    await loginAs(userA);

    const { GET: samplesGET } = await import("../../app/api/samples/route");
    const req = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/samples",
    });
    const res = await samplesGET(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);

    // None of the samples should belong to Tenant B
    const tenantBIds = body
      .filter((s: any) => s.tenantId === tenantB.id)
      .map((s: any) => s.id);
    expect(tenantBIds).toHaveLength(0);

    // Tenant A's sample IS present
    const tenantAIds = body.filter((s: any) => s.tenantId === tenantA.id).map((s: any) => s.id);
    expect(tenantAIds).toContain(sampleA.id);
  });

  // ── Reverse: Tenant B can't see Tenant A's data ─────────────
  it("Tenant B user gets 404 when requesting Tenant A's sample by ID", async () => {
    await loginAs(userB);

    const { GET: sampleGET } = await import(
      "../../app/api/samples/[id]/route"
    );
    const req = buildRequest({ method: "GET" });
    const res = await sampleGET(req as any, buildParams(sampleA.id));
    const { status } = await parseResponse(res);
    expect(status).toBe(404);
  });

  it("GET /api/samples for Tenant B never returns Tenant A's samples", async () => {
    await loginAs(userB);

    const { GET: samplesGET } = await import("../../app/api/samples/route");
    const req = buildRequest({
      method: "GET",
      url: "http://localhost:3000/api/samples",
    });
    const res = await samplesGET(req as any);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    const tenantAIds = body
      .filter((s: any) => s.tenantId === tenantA.id)
      .map((s: any) => s.id);
    expect(tenantAIds).toHaveLength(0);
  });

  // ── Tenant A can't use Tenant B's templates ─────────────────
  it("Tenant A cannot create a sample using Tenant B's template", async () => {
    await loginAs(userA);

    const { POST: createSamplePOST } = await import(
      "../../app/api/samples/route"
    );
    const req = buildRequest({
      body: { workflowTemplateId: templateB.id },
    });
    const res = await createSamplePOST(req as any);
    const { status } = await parseResponse(res);

    // Should be rejected — template belongs to another tenant
    expect([403, 404]).toContain(status);
  });
});

async function createSample(tenantId: string, workflowTemplateId: string) {
  return testDb.sample.create({
    data: {
      tenantId,
      workflowTemplateId,
      status: "in_progress",
      currentStageIndex: 0,
    },
  });
}
