"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Timeline, TimelineEntry } from "@/components/ui/timeline";

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

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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

const statusBadge: Record<string, { label: string; variant: "inProgress" | "flagged" | "completed" }> = {
  in_progress: { label: "In progress", variant: "inProgress" },
  flagged: { label: "Flagged", variant: "flagged" },
  completed: { label: "Completed", variant: "completed" },
};

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
      const res = await fetch(`/api/samples/${sample.id}/advance`, { method: "POST" });
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  if (!sample) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Sample not found.</p>
      </div>
    );
  }

  const currentStage = sample.template.stages[sample.currentStageIndex];
  const sb = statusBadge[sample.status] ?? { label: sample.status, variant: "inProgress" as const };
  const instrumentResult = sample.metadata?.instrumentResult as
    | { value: number; unit: string }
    | undefined;
  const isFlagged = sample.status === "flagged";
  const isLastStage = sample.currentStageIndex >= sample.template.stages.length - 1;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Flag banner */}
      {isFlagged && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
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
            <Button size="sm" variant="outline" disabled className="border-amber-300 text-amber-800/50 dark:border-amber-700 dark:text-amber-300/50">
              Approve
            </Button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white dark:bg-gray-100 dark:text-gray-900">
              Requires SeniorScientist role
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{sampleId(sample.id)}</h1>
            <Badge variant={sb.variant}>{sb.label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sample.template.name}
          </p>
        </div>
        {!isLastStage && !isFlagged && (
          <Button size="sm" onClick={handleAdvance} disabled={advancing}>
            {advancing && <Spinner />}
            {advancing ? "Advancing\u2026" : "Advance to next stage"}
          </Button>
        )}
      </div>

      {/* Current stage as large badge */}
      {currentStage && (
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Current stage
            </p>
            <Badge
              variant={currentStage.backgroundJob ? "automated" : "inProgress"}
              className="px-3 py-1 text-sm"
            >
              {currentStage.name}
            </Badge>
          </div>
          {currentStage.isApprovalGate && (
            <p className="text-xs text-muted-foreground">
              Requires {currentStage.requiredRole} approval
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div>
        <h2 className="text-sm font-medium mb-4">Timeline</h2>
        <Timeline>
          {/* Stage history entries */}
          {sample.history.map((h) => {
            const stage = sample.template.stages[h.stageIndex];
            return (
              <TimelineEntry
                key={h.id}
                type="stage"
                timestamp={formatTime(h.enteredAt)}
                actor={h.actorId === "instrument-webhook" ? "Instrument" : `User ${h.actorId.slice(0, 8)}`}
                description={
                  h.outcome === "flagged"
                    ? `${stage?.name ?? "Stage ${h.stageIndex + 1}"} flagged`
                    : h.outcome === "pass"
                      ? `${stage?.name ?? "Stage ${h.stageIndex + 1}"} completed`
                      : `Entered ${stage?.name ?? "stage ${h.stageIndex + 1}"}`
                }
              />
            );
          })}
        </Timeline>

        {/* Audit log toggle */}
        {sample.auditLogs.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowAudit(!showAudit)}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAudit ? "Hide full audit log" : "Show full audit log"}
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
