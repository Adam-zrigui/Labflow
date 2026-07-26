"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { StatCard } from "@/components/ui/stat-card";

interface Sample {
  id: string;
  status: string;
  currentStageIndex: number;
  createdAt: string;
  template: { name: string };
}

const statusMap: Record<string, { label: string; variant: "inProgress" | "flagged" | "completed" | "pending" }> = {
  in_progress: { label: "In progress", variant: "inProgress" },
  flagged: { label: "Flagged", variant: "flagged" },
  completed: { label: "Completed", variant: "completed" },
};

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sampleId(id: string) {
  return "SMP-" + id.slice(0, 4).toUpperCase();
}

export default function DashboardPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSamples = useCallback(async () => {
    try {
      const res = await fetch("/api/samples");
      if (res.ok) setSamples(await res.json());
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSamples();
  }, [fetchSamples]);

  const inProgress = samples.filter((s) => s.status === "in_progress").length;
  const flagged = samples.filter((s) => s.status === "flagged").length;
  const todayCompleted = samples.filter(
    (s) =>
      s.status === "completed" &&
      new Date(s.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Samples</h1>
        <Button size="sm" onClick={() => router.push("/dashboard/samples/new")}>Register sample</Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="In progress" value={inProgress} />
        <StatCard label="Flagged for review" value={flagged} accent="amber" />
        <StatCard label="Completed today" value={todayCompleted} accent="green" />
      </div>

      {/* Table or empty state */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-5 text-muted-foreground" />
        </div>
      ) : samples.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12">
          <h2 className="text-base font-medium">Register your first sample</h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Samples track specimens through your lab&apos;s workflow from receipt to
            completed report.
          </p>
          <Button size="sm" className="mt-2" onClick={() => router.push("/dashboard/samples/new")}>
            Register sample
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Sample</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Stage</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Assigned to</th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => {
                const status = statusMap[sample.status] ?? {
                  label: sample.status,
                  variant: "pending" as const,
                };
                return (
                  <tr
                    key={sample.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs font-medium">
                      <Link href={`/dashboard/samples/${sample.id}`} className="block">
                        {sampleId(sample.id)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/samples/${sample.id}`} className="block">
                        <Badge variant="inProgress">Stage {sample.currentStageIndex + 1}</Badge>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link href={`/dashboard/samples/${sample.id}`} className="block">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      <Link href={`/dashboard/samples/${sample.id}`} className="block">
                        &mdash;
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                      <Link href={`/dashboard/samples/${sample.id}`} className="block">
                        {relativeTime(sample.createdAt)}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
