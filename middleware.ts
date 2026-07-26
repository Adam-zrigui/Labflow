import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard dashboard routes and non-auth/api routes
  const isProtected = pathname.startsWith("/dashboard")
    ? true
    : pathname.startsWith("/api") &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/webhooks");

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("session");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await verifySessionToken(sessionCookie.value);
  } catch {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
