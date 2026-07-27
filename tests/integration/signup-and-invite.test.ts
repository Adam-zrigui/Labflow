import { describe, it, expect, beforeAll } from "vitest";
import { testDb, setSession, clearSession } from "./setup";
import { createTenantAndUser, loginAs, buildRequest, parseResponse } from "./helpers";
import { POST as registerPOST } from "../../app/api/auth/register/route";
import { POST as invitePOST } from "../../app/api/team/invite/route";
import { POST as acceptInvitePOST } from "../../app/api/team/accept-invite/route";

describe("Signup and Invite flow", () => {
  let adminFirebaseUid: string;
  let adminUserId: string;
  let adminTenantId: string;
  let inviteToken: string;

  beforeAll(async () => {
    adminFirebaseUid = `fb-admin-${Date.now()}`;
  });

  it("POST /api/auth/register creates a Tenant + Admin User", async () => {
    const req = buildRequest({
      body: {
        firebaseUid: adminFirebaseUid,
        email: "admin@testlab.com",
        labName: "Test Lab Corp",
      },
    });

    const res = await registerPOST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(200);

    // Verify tenant was created
    const tenants = await testDb.tenant.findMany({
      where: { name: "Test Lab Corp" },
    });
    expect(tenants).toHaveLength(1);
    adminTenantId = tenants[0].id;

    // Verify admin user was created
    const adminUser = await testDb.user.findFirst({
      where: { firebaseUid: adminFirebaseUid },
    });
    expect(adminUser).not.toBeNull();
    expect(adminUser!.role).toBe("Admin");
    expect(adminUser!.tenantId).toBe(adminTenantId);
    expect(adminUser!.email).toBe("admin@testlab.com");
    adminUserId = adminUser!.id;
  });

  it("Admin invites a Technician via POST /api/team/invite", async () => {
    // Guard: only run if previous test succeeded
    if (!adminUserId) {
      console.warn("Skipping: adminUserId not set (register test failed)");
      return;
    }

    // Assign a plan to the tenant so the billing gate passes
    await testDb.tenant.update({
      where: { id: adminTenantId },
      data: { planId: "plan-starter" },
    });

    await loginAs({
      id: adminUserId,
      tenantId: adminTenantId,
      role: "Admin",
      email: "admin@testlab.com",
      firebaseUid: adminFirebaseUid,
    });

    const req = buildRequest({
      body: {
        email: "tech@testlab.com",
        role: "Technician",
      },
    });

    const res = await invitePOST(req as any);
    const { status, body } = await parseResponse(res);
    expect(status).toBe(201);
    expect(body.invite.email).toBe("tech@testlab.com");
    expect(body.invite.role).toBe("Technician");

    // Get the token from the DB directly (most reliable)
    const dbInvite = await testDb.inviteToken.findFirst({
      where: { email: "tech@testlab.com", tenantId: adminTenantId },
    });
    expect(dbInvite).not.toBeNull();
    expect(dbInvite!.role).toBe("Technician");
    inviteToken = dbInvite!.token;
  });

  it("Simulate accepting the invite via POST /api/team/accept-invite", async () => {
    if (!inviteToken) {
      console.warn("Skipping: inviteToken not set (invite test failed)");
      return;
    }

    clearSession(); // accept-invite is unauthenticated

    const req = buildRequest({
      body: {
        token: inviteToken,
        firebaseUid: "fb-tech-001",
      },
    });

    const res = await acceptInvitePOST(req as any);
    const { status } = await parseResponse(res);
    expect(status).toBe(200);

    // Verify the new user
    const techUser = await testDb.user.findFirst({
      where: { firebaseUid: "fb-tech-001" },
    });
    expect(techUser).not.toBeNull();
    expect(techUser!.role).toBe("Technician");
    expect(techUser!.tenantId).toBe(adminTenantId);
    expect(techUser!.email).toBe("tech@testlab.com");

    // Verify invite is marked as used
    const dbInvite = await testDb.inviteToken.findFirst({
      where: { token: inviteToken },
    });
    expect(dbInvite!.usedAt).not.toBeNull();
  });

  it("The new user CANNOT access another tenant's data", async () => {
    // Create a second tenant with a sample
    const { tenant: otherTenant } = await createTenantAndUser({
      tenantName: "Other Lab",
      email: "other@test.com",
      firebaseUid: "fb-other-001",
      role: "Admin",
    });

    const template = await testDb.workflowTemplate.create({
      data: {
        tenantId: otherTenant.id,
        name: "Other Workflow",
        stages: [{ name: "Step 1", requiredRole: "Technician" }] as never,
      },
    });

    const otherSample = await testDb.sample.create({
      data: {
        tenantId: otherTenant.id,
        workflowTemplateId: template.id,
        status: "in_progress",
      },
    });

    // Login as the Technician from the first tenant
    const techUser = await testDb.user.findFirst({
      where: { firebaseUid: "fb-tech-001" },
    });
    if (!techUser) {
      console.warn("Skipping: tech user not found (previous test failed)");
      return;
    }
    await loginAs(techUser);

    // Try to access the other tenant's sample — should get 404
    const { GET: sampleGET } = await import(
      "../../app/api/samples/[id]/route"
    );
    const req = buildRequest({ method: "GET" });
    const res = await sampleGET(req as any, { params: Promise.resolve({ id: otherSample.id }) });
    expect(res.status).toBe(404);

    // List samples — should NOT include the other tenant's sample
    const { GET: samplesGET } = await import("../../app/api/samples/route");
    const listReq = buildRequest({ method: "GET", url: "http://localhost:3000/api/samples" });
    const listRes = await samplesGET(listReq as any);
    const listBody = await parseResponse(listRes);
    expect(listBody.status).toBe(200);
    const sampleIds = listBody.body.map((s: any) => s.id);
    expect(sampleIds).not.toContain(otherSample.id);
  });
});
