"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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
  Search,
  X,
  Download,
  ChevronRight,
} from "lucide-react";

interface Sample {
  id: string;
  status: string;
  currentStageIndex: number;
  createdAt: string;
  template: { name: string };
}

interface BulkResult {
  succeeded: string[];
  failed: { id: string; reason: string }[];
}

const statusMap: Record<
  string,
  { label: string; variant: "inProgress" | "flagged" | "completed" | "pending" }
> = {
  in_progress: { label: "In progress", variant: "inProgress" },
  flagged: { label: "Flagged", variant: "flagged" },
  completed: { label: "Completed", variant: "completed" },
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

export default function SamplesPage() {
  const router = useRouter();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    let result = samples;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((s) => sampleId(s.id).toLowerCase().includes(q));
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    return result;
  }, [samples, search, statusFilter]);

  const hasFilters = search.trim() !== "" || statusFilter !== "all";

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((s) => s.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkAdvance = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/samples/bulk-advance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleIds: Array.from(selected) }),
      });
      const data: BulkResult = await res.json();
      const parts: string[] = [];
      if (data.succeeded.length > 0)
        parts.push(`${data.succeeded.length} advanced`);
      if (data.failed.length > 0) {
        const reasons = [...new Set(data.failed.map((f) => f.reason))];
        parts.push(`${data.failed.length} skipped (${reasons[0] ?? "error"})`);
      }
      setToast(parts.join(", "));
      setSelected(new Set());
      fetchSamples();
    } catch {
      setToast("Bulk advance failed");
    } finally {
      setBulkLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    window.location.href = `/api/samples/export?${params.toString()}`;
  };

  const inProgress = samples.filter((s) => s.status === "in_progress").length;
  const flagged = samples.filter((s) => s.status === "flagged").length;
  const todayCompleted = samples.filter(
    (s) =>
      s.status === "completed" &&
      new Date(s.createdAt).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Toast */}
      {toast && (
        <div className="border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950/50 dark:text-green-300 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">Samples</h1>
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
          <div className="border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">In progress</p>
            <p className="text-2xl font-semibold tabular-nums font-[family-name:var(--font-space-grotesk)] text-foreground">{inProgress}</p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Flagged</p>
            <p className="text-2xl font-semibold tabular-nums font-[family-name:var(--font-space-grotesk)] text-amber-600">{flagged}</p>
          </div>
          <div className="border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-semibold tabular-nums font-[family-name:var(--font-space-grotesk)] text-green-600">{todayCompleted}</p>
          </div>
        </div>
      )}

      {/* Search + filter bar (only when samples exist) */}
      {!loading && samples.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Sample ID\u2026"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full border border-border bg-background pl-9 pr-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="in_progress">In progress</option>
              <option value="flagged">Flagged</option>
              <option value="completed">Completed</option>
            </select>
            {hasFilters && (
              <button
                type="button"
                onClick={() => { setSearch(""); setStatusFilter("all"); }}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 border border-primary/30 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-foreground">
            {selected.size} sample{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="gap-1.5"
            >
              <Download className="size-3.5" />
              Export selected
            </Button>
            <Button
              size="sm"
              onClick={handleBulkAdvance}
              disabled={bulkLoading}
              className="gap-1.5"
            >
              {bulkLoading ? (
                <Spinner className="size-3" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
              {bulkLoading ? "Advancing\u2026" : "Advance selected"}
            </Button>
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
        />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 border border-dashed border-border bg-card p-8 text-center">
          <Search className="size-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No samples match your filters
          </p>
          <p className="text-xs text-muted-foreground/70">
            Try adjusting your search or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="size-4 rounded border-input"
                    aria-label="Select all samples"
                  />
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground font-[family-name:var(--font-space-grotesk)]">
                  Sample ID
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground font-[family-name:var(--font-space-grotesk)]">
                  Stage
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground font-[family-name:var(--font-space-grotesk)]">
                  Assigned
                </th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground font-[family-name:var(--font-space-grotesk)]">
                  Updated
                </th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((sample) => {
                const status = statusMap[sample.status] ?? {
                  label: sample.status,
                  variant: "pending" as const,
                };
                return (
                  <tr
                    key={sample.id}
                    className="group border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(sample.id)}
                        onChange={() => toggleOne(sample.id)}
                        className="size-4 rounded border-input"
                        aria-label={`Select ${sampleId(sample.id)}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/samples/${sample.id}`}
                        className="flex items-center gap-2.5"
                      >
                        <span className="specimen-chip">
                          {sampleId(sample.id)}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="inProgress">
                        Stage {sample.currentStageIndex + 1}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">—</td>
                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs tabular-nums">
                      {relativeTime(sample.createdAt)}
                    </td>
                    <td className="px-3 py-2">
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
