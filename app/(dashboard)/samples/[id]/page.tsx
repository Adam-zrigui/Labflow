"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonTimeline } from "@/components/ui/skeleton";
import { Timeline, TimelineEntry } from "@/components/ui/timeline";
import { EmptyState, NotFoundIllustration } from "@/components/empty-state";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Loader2,
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
  { label: string; variant: "inProgress" | "flagged" | "completed" }
> = {
  in_progress: { label: "In progress", variant: "inProgress" },
  flagged: { label: "Flagged", variant: "flagged" },
  completed: { label: "Completed", variant: "completed" },
};

function SampleSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="rounded-xl border bg-card p-5 shadow-xs">
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
      <div className="rounded-xl border bg-card p-5 shadow-xs">
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
    try {
      const res = await fetch(`/api/samples/${sample.id}/advance`, {
        method: "POST",
      });
      if (res.ok) {
        const updated = await res.json();
        setSample((prev) => (prev ? { ...prev, ...updated } : null));
      }
    } catch {
      // silent
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
            <Link href="/">
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

  const currentStage = sample.template.stages[sample.currentStageIndex];
  const sb = statusBadge[sample.status] ?? {
    label: sample.status,
    variant: "inProgress" as const,
  };
  const instrumentResult = sample.metadata?.instrumentResult as
    | { value: number; unit: string }
    | undefined;
  const isFlagged = sample.status === "flagged";
  const isLastStage =
    sample.currentStageIndex >= sample.template.stages.length - 1;
  const totalStages = sample.template.stages.length;
  const progressPct = totalStages > 0
    ? Math.round(((sample.currentStageIndex + (isLastStage ? 1 : 0)) / totalStages) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Samples
      </Link>

      {/* Flag banner */}
      {isFlagged && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 dark:border-amber-800/50 dark:bg-amber-950/50">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
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
              className="border-amber-300 text-amber-800/50 dark:border-amber-700 dark:text-amber-300/50"
            >
              Approve
            </Button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs text-background shadow-lg">
              Requires SeniorScientist role
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">
              {sampleId(sample.id)}
            </h1>
            <Badge variant={sb.variant}>{sb.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {sample.template.name}
          </p>
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

      {/* Stage progress stepper */}
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workflow progress
          </h2>
          <span className="text-xs font-medium text-primary">{progressPct}%</span>
        </div>

        {/* Progress bar */}
        <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Stage dots */}
        <div className="flex items-start gap-0 overflow-x-auto pb-1">
          {sample.template.stages.map((stage, idx) => {
            const isCompleted = idx < sample.currentStageIndex;
            const isCurrent = idx === sample.currentStageIndex;
            const isLast = idx === sample.template.stages.length - 1;

            return (
              <div key={idx} className="flex items-start">
                <div className="flex flex-col items-center min-w-[72px]">
                  {/* Dot */}
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      isCompleted
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : isCurrent
                          ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="size-4" />
                    ) : isCurrent ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={`mt-2 text-center text-[11px] font-medium leading-tight ${
                      isCurrent
                        ? "text-foreground"
                        : isCompleted
                          ? "text-primary"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stage.name}
                  </span>
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div className="flex items-center pt-3.5 px-0.5">
                    <div
                      className={`h-0.5 w-8 rounded-full ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {currentStage?.isApprovalGate && (
          <p className="mt-4 text-xs text-muted-foreground border-t pt-3">
            Requires {currentStage.requiredRole} approval to proceed
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Timeline
          </h2>
        </div>
        {sample.history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No history entries yet. Advance the sample to see activity here.
          </p>
        ) : (
          <Timeline>
            {sample.history.map((h) => {
              const stage = sample.template.stages[h.stageIndex];
              const color =
                h.outcome === "flagged"
                  ? "amber"
                  : h.outcome === "pass"
                    ? "green"
                    : "blue";
              return (
                <TimelineEntry
                  key={h.id}
                  type="stage"
                  color={color}
                  timestamp={formatTime(h.enteredAt)}
                  actor={
                    h.actorId === "instrument-webhook"
                      ? "Instrument"
                      : `User ${h.actorId.slice(0, 8)}`
                  }
                  description={
                    h.outcome === "flagged"
                      ? `${stage?.name ?? `Stage ${h.stageIndex + 1}`} flagged`
                      : h.outcome === "pass"
                        ? `${stage?.name ?? `Stage ${h.stageIndex + 1}`} completed`
                        : `Entered ${stage?.name ?? `stage ${h.stageIndex + 1}`}`
                  }
                />
              );
            })}
          </Timeline>
        )}

        {/* Audit log toggle */}
        {sample.auditLogs.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAudit(!showAudit)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAudit ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
              {showAudit ? "Hide" : "Show"} full audit log
            </button>
            {showAudit && (
              <div className="mt-3">
                <Timeline>
                  {sample.auditLogs.map((log) => (
                    <TimelineEntry
                      key={log.id}
                      type="audit"
                      muted
                      timestamp={formatTime(log.timestamp)}
                      actor={`User ${log.actorId.slice(0, 8)}`}
                      description={log.action.replace(/_/g, " ")}
                    />
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
