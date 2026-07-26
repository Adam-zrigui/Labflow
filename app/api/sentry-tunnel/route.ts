import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const envelope = await request.text();
    const piece = envelope.split("\n")[0];
    const header = JSON.parse(piece);

    const dsn = new URL(header.dsn);

    if (!dsn.hostname.endsWith("sentry.io")) {
      return NextResponse.json({ error: "Invalid Sentry host" }, { status: 400 });
    }

    const upstreamUrl = `https://${dsn.hostname}/api/${dsn.pathname}/envelope/`;
    const upstreamRes = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-sentry-envelope" },
      body: envelope,
    });

    return new NextResponse(null, { status: upstreamRes.status });
  } catch {
    return NextResponse.json({ error: "Tunnel failed" }, { status: 500 });
  }
}
