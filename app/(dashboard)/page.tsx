"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SkeletonCard,
  SkeletonTable,
} from "@/components/ui/skeleton";
import {
  EmptyState,
  FlaskIllustration,
} from "@/components/empty-state";
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Settings2,
  TestTubeDiagonal,
  Activity,
} from "lucide-react";

interface Sample {
  id: string;
  status: string;
  currentStageIndex: number;
  createdAt: string;
  template: { name: string };
}

const statusMap: Record<
  string,
  { label: string; variant: "inProgress" | "flagged" | "completed" | "pending" }
> = {
  in_progress: { label: "In progress", variant: "inProgress" },
  flagged: { label: "Flagged", variant: "flagged" },
  completed: { label: "Completed", variant: "completed" },
};

const statusDot: Record<string, string> = {
  in_progress: "bg-blue-500",
  flagged: "bg-amber-500",
  completed: "bg-green-500",
};

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
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
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Samples</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Track specimens through your lab&apos;s workflow
          </p>
        </div>
        <Button onClick={() => router.push("/samples/new")} className="gap-1.5">
          <Plus className="size-4" />
          Register sample
        </Button>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">In progress</p>
              <p className="text-2xl font-semibold tabular-nums">{inProgress}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Flagged for review</p>
              <p className="text-2xl font-semibold tabular-nums">{flagged}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Completed today</p>
              <p className="text-2xl font-semibold tabular-nums">{todayCompleted}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table or empty state */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : samples.length === 0 ? (
        <EmptyState
          title="Register your first sample"
          description="Samples track specimens through your lab's workflow from receipt to completed report."
          illustration={<FlaskIllustration />}
          action={
            <Button onClick={() => router.push("/samples/new")} className="gap-1.5">
              <Plus className="size-4" />
              Register sample
            </Button>
          }
        >
          <div className="space-y-3">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              How it works
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/templates"
                className="group flex flex-col items-center gap-2.5 rounded-xl border bg-background p-4 text-center transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Settings2 className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">1. Create a template</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Define workflow stages
                  </p>
                </div>
              </Link>
              <div className="flex flex-col items-center gap-2.5 rounded-xl border bg-background p-4 text-center">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TestTubeDiagonal className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">2. Register a sample</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Attach it to a template
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2.5 rounded-xl border bg-background p-4 text-center">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="size-4.5" />
                </div>
                <div>
                  <p className="text-sm font-medium">3. Track progress</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Advance through stages
                  </p>
                </div>
              </div>
            </div>
          </div>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Sample
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Stage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last updated
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {samples.map((sample) => {
                const status = statusMap[sample.status] ?? {
                  label: sample.status,
                  variant: "pending" as const,
                };
                return (
                  <tr
                    key={sample.id}
                    className="group transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/samples/${sample.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${statusDot[sample.status] ?? "bg-muted-foreground/30"}`}
                        />
                        <span className="font-mono text-xs font-semibold text-primary">
                          {sampleId(sample.id)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="inProgress">
                        Stage {sample.currentStageIndex + 1}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">
                      {relativeTime(sample.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/samples/${sample.id}`}
                        className="flex items-center gap-1 text-xs font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                      >
                        View
                        <ArrowRight className="size-3" />
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
