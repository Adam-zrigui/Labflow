"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonTimeline } from "@/components/ui/skeleton";
import { EmptyState, NotFoundIllustration } from "@/components/empty-state";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";

interface Stage {
  name: string;
  requiredRole: string;
  isApprovalGate?: boolean;
  backgroundJob?: boolean;
}

interface HistoryEntry {
  id: string;
  stageIndex: number;
  enteredAt: string;
  exitedAt: string | null;
  actorId: string;
  outcome: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  actorId: string;
  timestamp: string;
  before: unknown;
  after: unknown;
}

interface SampleData {
  id: string;
  workflowTemplateId: string;
  currentStageIndex: number;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  history: HistoryEntry[];
  template: { name: string; stages: Stage[] };
  auditLogs: AuditEntry[];
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sampleId(id: string) {
  return "SMP-" + id.slice(0, 4).toUpperCase();
}

const statusBadge: Record<
  string,
  { label: string; variant: "inProgress" | "flagged" | "completed"; icon: React.ReactNode }
> = {
  in_progress: {
    label: "In progress",
    variant: "inProgress",
    icon: <Clock className="size-3" />,
  },
  flagged: {
    label: "Flagged",
    variant: "flagged",
    icon: <AlertTriangle className="size-3" />,
  },
  completed: {
    label: "Completed",
    variant: "completed",
    icon: <CheckCircle2 className="size-3" />,
  },
};

function SampleSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="border border-border bg-card p-5">
        <Skeleton className="h-3 w-36 mb-4" />
        <div className="flex items-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className="border border-border bg-card p-5">
        <Skeleton className="h-3 w-20 mb-4" />
        <SkeletonTimeline entries={3} />
      </div>
    </div>
  );
}

export default function SampleDetailPage() {
  const params = useParams();
  const [sample, setSample] = useState<SampleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAudit, setShowAudit] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSample = useCallback(async () => {
    try {
      const res = await fetch(`/api/samples/${params.id}`);
      if (res.ok) setSample(await res.json());
    } catch {
      // handled by null check
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchSample();
  }, [fetchSample]);

  const handleAdvance = async () => {
    if (!sample || advancing) return;
    setAdvancing(true);
    setError(null);

    const prevIndex = sample.currentStageIndex;
    const prevHistory = sample.history;
    const optimisticHistory: HistoryEntry = {
      id: `temp-${Date.now()}`,
      stageIndex: prevIndex,
      enteredAt: new Date().toISOString(),
      exitedAt: null,
      actorId: "you",
      outcome: null,
    };

    setSample((prev) =>
      prev
        ? {
            ...prev,
            currentStageIndex: prevIndex + 1,
            status:
              prevIndex + 1 >= prev.template.stages.length
                ? "completed"
                : prev.status,
            history: [...prev.history, optimisticHistory],
          }
        : null
    );

    try {
      const res = await fetch(`/api/samples/${sample.id}/advance`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        setSample((prev) => (prev ? { ...prev, ...updated } : null));
      } else {
        // rollback
        setSample((prev) =>
          prev
            ? {
                ...prev,
                currentStageIndex: prevIndex,
                status: sample.status,
                history: prevHistory,
              }
            : null
        );
        setError("Failed to advance sample. Please try again.");
      }
    } catch {
      setSample((prev) =>
        prev
          ? {
              ...prev,
              currentStageIndex: prevIndex,
              status: sample.status,
              history: prevHistory,
            }
          : null
      );
      setError("Network error. Please try again.");
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) return <SampleSkeleton />;

  if (!sample) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <EmptyState
          title="Sample not found"
          description="This sample may have been deleted or the ID is incorrect."
          illustration={<NotFoundIllustration />}
          action={
            <Link href="/samples">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className="size-3.5" />
                Back to samples
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const sb = statusBadge[sample.status] ?? {
    label: sample.status,
    variant: "inProgress" as const,
    icon: null,
  };
  const instrumentResult = sample.metadata?.instrumentResult as
    | { value: number; unit: string }
    | undefined;
  const isFlagged = sample.status === "flagged";
  const isLastStage =
    sample.currentStageIndex >= sample.template.stages.length - 1;
  const totalStages = sample.template.stages.length;

  return (
    <div className="flex flex-col gap-5 p-6 lg:p-8">
      {/* 1. Back link */}
      <Link
        href="/samples"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to samples
      </Link>

      {/* 2. Specimen chip + Status badge */}
      <div className="flex items-center gap-3">
        <span className="specimen-chip text-base px-3 py-1">
          {sampleId(sample.id)}
        </span>
        <Badge variant={sb.variant} className="gap-1">
          {sb.icon}
          {sb.label}
        </Badge>
      </div>

      {/* 3. Template name + "Stage X of Y" */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-medium text-foreground">
            {sample.template.name}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            Stage {sample.currentStageIndex + 1} of {totalStages}
          </span>
        </div>
        {!isLastStage && !isFlagged && (
          <Button onClick={handleAdvance} disabled={advancing} className="gap-1.5">
            {advancing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {advancing ? "Advancing\u2026" : "Advance stage"}
          </Button>
        )}
      </div>

      {/* 4. Hairline separator */}
      <div className="border-t border-border" />

      {/* Error banner */}
      {error && (
        <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300">
          {error}
        </div>
      )}

      {/* 5. Flag banner (only when flagged) */}
      {isFlagged && (
        <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 px-4 py-3.5 dark:border-amber-700 dark:bg-amber-950/50">
          <div className="flex size-8 shrink-0 items-center justify-center border border-amber-300 bg-amber-100 text-amber-600 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <AlertTriangle className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Sample flagged
            </p>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
              {instrumentResult
                ? `Result ${instrumentResult.value} ${instrumentResult.unit} is out of reference range.`
                : "This sample requires review before it can advance."}
            </p>
          </div>
          <div className="group relative shrink-0">
            <Button
              size="sm"
              variant="outline"
              disabled
              className="border-amber-400 text-amber-800/50 dark:border-amber-600 dark:text-amber-300/50"
            >
              Approve
            </Button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-foreground px-2.5 py-1 text-xs text-background shadow-lg">
              Requires SeniorScientist role
            </div>
          </div>
        </div>
      )}

      {/* 6. Hairline separator (only when flagged) */}
      {isFlagged && <div className="border-t border-border" />}

      {/* 7–9. Timeline (vertical line left, seals, no stepper) */}
      <div className="relative">
        {sample.history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No history entries yet. Advance the sample to see activity here.
          </p>
        ) : (
          <div className="relative ml-3">
            {/* Vertical line left */}
            <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />

            <div className="flex flex-col">
              {sample.history.map((h, idx) => {
                const stage = sample.template.stages[h.stageIndex];
                const isCompleted = h.exitedAt !== null;

                return (
                  <div key={h.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Seal (filled = completed/past, outline = current) */}
                    <div className="relative z-10 -ml-3 flex size-6 shrink-0 items-center justify-center">
                      {isCompleted ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                          ●
                        </span>
                      ) : (
                        <span className="flex size-6 items-center justify-center rounded-full border-2 border-primary bg-background text-[10px] font-semibold text-primary">
                          ○
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-[11px] font-medium text-muted-foreground font-mono leading-none mb-1">
                        {formatTime(h.enteredAt)}
                        <span className="mx-1.5 text-border">·</span>
                        {h.actorId === "instrument-webhook"
                          ? "Instrument"
                          : h.actorId === "you"
                            ? "You"
                            : `User ${h.actorId.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-foreground leading-snug">
                        {h.outcome === "flagged"
                          ? `${stage?.name ?? `Stage ${h.stageIndex + 1}`} flagged`
                          : h.outcome === "pass"
                            ? `${stage?.name ?? `Stage ${h.stageIndex + 1}`} completed`
                            : `Entered ${stage?.name ?? `stage ${h.stageIndex + 1}`}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 9. Audit log — collapsed by default */}
      {sample.auditLogs.length > 0 && (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowAudit(!showAudit)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
          >
            {showAudit ? (
              <EyeOff className="size-3.5" />
            ) : (
              <Eye className="size-3.5" />
            )}
            {showAudit ? "Hide" : "Show"} full audit log
          </button>
          {showAudit && (
            <div className="mt-3 pl-3 border-l-2 border-border/50">
              {sample.auditLogs.map((log) => (
                <div key={log.id} className="py-2 last:py-0">
                  <p className="text-[11px] font-medium text-muted-foreground font-mono leading-none mb-0.5">
                    {formatTime(log.timestamp)}
                    <span className="mx-1.5 text-border">·</span>
                    User {log.actorId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-foreground/80 font-mono">
                    {log.action.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
