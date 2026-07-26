import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;
  const { id } = await params;

  const sample = await prisma.sample.findUnique({
    where: { id },
    include: {
      history: {
        orderBy: { stageIndex: "asc" },
      },
      template: {
        select: { name: true, stages: true },
      },
    },
  });

  // 404 whether not found OR belongs to another tenant (don't leak existence)
  if (!sample || sample.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Sample not found" }, { status: 404 });
  }

  // Fetch relevant audit log entries
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "Sample",
      entityId: id,
    },
    orderBy: { timestamp: "asc" },
  });

  return NextResponse.json({ ...sample, auditLogs });
}
