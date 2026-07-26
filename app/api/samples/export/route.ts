import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import type { Stage } from "@/lib/workflow-engine";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { tenantId: session.tenantId };

  if (status && ["in_progress", "flagged", "completed"].includes(status)) {
    where.status = status;
  }

  const samples = await prisma.sample.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true, stages: true } },
    },
  });

  let filtered = samples;

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((s) => {
      const shortId = "SMP-" + s.id.slice(0, 4).toUpperCase();
      return shortId.toLowerCase().includes(q);
    });
  }

  const header = "Sample ID,Template,Current Stage,Status,Created At,Last Updated";
  const rows = filtered.map((s) => {
    const shortId = "SMP-" + s.id.slice(0, 4).toUpperCase();
    const stages = s.template.stages as unknown as Stage[];
    const currentStage = stages[s.currentStageIndex]?.name ?? `Stage ${s.currentStageIndex + 1}`;
    const statusLabel =
      s.status === "in_progress"
        ? "In progress"
        : s.status === "flagged"
          ? "Flagged"
          : s.status === "completed"
            ? "Completed"
            : s.status;
    const created = s.createdAt.toISOString();
    const updated = s.createdAt.toISOString();

    return [shortId, s.template.name, currentStage, statusLabel, created, updated]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [header, ...rows].join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="labflow-samples-${date}.csv"`,
    },
  });
}
