import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public pages — no auth required
  const publicPages = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/terms", "/privacy", "/impressum"];
  if (publicPages.includes(pathname)) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith("/api");
  const isPublicApi =
    pathname.startsWith("/api/auth") || pathname.startsWith("/api/webhooks") || pathname === "/api/health";

  if (isApiRoute && isPublicApi) {
    return NextResponse.next();
  }

  // Everything else requires a valid session
  const sessionCookie = request.cookies.get("session");

  if (!sessionCookie?.value) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await verifySessionToken(sessionCookie.value);
  } catch {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};
