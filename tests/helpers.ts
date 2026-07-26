/**
 * Build a minimal NextRequest-like Request for testing route handlers.
 * Route handlers expect NextRequest which extends Request. For smoke tests,
 * a standard Request works fine since we're testing the handler's logic,
 * not Next.js internals.
 */
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
}) {
  const init: RequestInit & { headers: Record<string, string> } = {
    method,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    // If body is already a string (e.g., pre-stringified JSON), use it as-is
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  return new Request(url, init);
}

/**
 * Build the `{ params }` object for dynamic route handlers like:
 *   GET(request, { params }: { params: Promise<{ id: string }> })
 */
export function buildParams(id: string) {
  return Promise.resolve({ id });
}

/**
 * Parse a Response into its JSON body and status.
 */
export async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return {
    status: response.status,
    body,
  };
}
