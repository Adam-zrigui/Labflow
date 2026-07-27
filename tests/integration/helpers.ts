import { testDb, setSession, clearSession, type SessionPayload } from "./setup";

// ─── Request builder ─────────────────────────────────────────────
export function buildRequest({
  method = "POST",
  body,
  headers = {},
  url = "http://localhost:3000",
}: {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  url?: string;
} = {}) {
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  return new Request(url, init);
}

export function buildParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

export async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { status: response.status, body };
}

// ─── Auth helpers ────────────────────────────────────────────────
export async function createTenantAndUser(opts: {
  tenantName?: string;
  email: string;
  firebaseUid: string;
  role?: string;
  planId?: string;
}) {
  const tenant = await testDb.tenant.create({
    data: {
      name: opts.tenantName ?? `Test Tenant ${Date.now()}`,
      planId: opts.planId ?? "plan-starter",
      subscriptionStatus: "active",
    },
  });

  const user = await testDb.user.create({
    data: {
      tenantId: tenant.id,
      email: opts.email,
      firebaseUid: opts.firebaseUid,
      role: opts.role ?? "Admin",
    },
  });

  return { tenant, user };
}

export async function loginAs(user: {
  id: string;
  tenantId: string;
  role: string;
  email: string;
  firebaseUid: string;
}) {
  await setSession({
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role,
    email: user.email,
    firebaseUid: user.firebaseUid,
  });
}

export function logout() {
  clearSession();
}

// ─── Template helpers ────────────────────────────────────────────
export async function createWorkflowTemplate(
  tenantId: string,
  name: string,
  stages: Array<{
    name: string;
    requiredRole: string;
    requiredFields?: string[];
    isApprovalGate?: boolean;
    backgroundJob?: boolean;
  }>
) {
  return testDb.workflowTemplate.create({
    data: {
      tenantId,
      name,
      stages: stages as never,
    },
  });
}

// ─── Sample helpers ──────────────────────────────────────────────
export async function createSample(
  tenantId: string,
  workflowTemplateId: string,
  opts?: { status?: string; currentStageIndex?: number; metadata?: Record<string, unknown> }
) {
  return testDb.sample.create({
    data: {
      tenantId,
      workflowTemplateId,
      status: opts?.status ?? "in_progress",
      currentStageIndex: opts?.currentStageIndex ?? 0,
      metadata: (opts?.metadata as never) ?? undefined,
    },
  });
}
