"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonCardGrid, Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ClipboardIllustration } from "@/components/empty-state";
import {
  Plus,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Check,
} from "lucide-react";

interface Stage {
  name: string;
  requiredRole: string;
  isApprovalGate?: boolean;
  backgroundJob?: boolean;
}

interface Template {
  id: string;
  name: string;
  stages: Stage[];
  updatedAt: string;
}

const ROLES = ["Technician", "SeniorScientist", "Admin"] as const;

function emptyStage(): Stage {
  return { name: "", requiredRole: "Technician" };
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) setTemplates(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const startNew = () => {
    setEditing({ id: "", name: "", stages: [emptyStage()], updatedAt: new Date().toISOString() });
    setSaved(false);
  };

  const startEdit = (t: Template) => {
    setEditing({ ...t, stages: t.stages.map((s) => ({ ...s })) });
    setSaved(false);
  };

  const addStage = () => {
    if (!editing) return;
    setEditing({ ...editing, stages: [...editing.stages, emptyStage()] });
  };

  const removeStage = (idx: number) => {
    if (!editing || editing.stages.length <= 1) return;
    setEditing({
      ...editing,
      stages: editing.stages.filter((_, i) => i !== idx),
    });
  };

  const moveStage = (idx: number, dir: -1 | 1) => {
    if (!editing) return;
    const stages = [...editing.stages];
    const target = idx + dir;
    if (target < 0 || target >= stages.length) return;
    [stages[idx], stages[target]] = [stages[target], stages[idx]];
    setEditing({ ...editing, stages });
  };

  const updateStage = (
    idx: number,
    field: keyof Stage,
    value: string | boolean
  ) => {
    if (!editing) return;
    const stages = editing.stages.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    setEditing({ ...editing, stages });
  };

  const saveTemplate = async () => {
    if (
      !editing ||
      !editing.name.trim() ||
      editing.stages.some((s) => !s.name.trim())
    )
      return;
    setSaving(true);
    setSaved(false);
    try {
      const isNew = !editing.id;
      const url = isNew ? "/api/templates" : `/api/templates/${editing.id}`;
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          stages: editing.stages,
        }),
      });

      if (res.ok) {
        setSaved(true);
        fetchTemplates();
      }
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-[960px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <SkeletonCardGrid count={6} />
      </div>
    );
  }

  // Editing mode
  if (editing) {
    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </button>
            <h1 className="text-xl font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">
              {editing.id ? "Edit template" : "New template"}
            </h1>
          </div>
        </div>

        {saved && (
          <div className="border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-700 dark:bg-green-950/50 dark:text-green-400 flex items-center gap-2">
            <Check className="size-4" />
            Template saved successfully
          </div>
        )}

        {/* Name — inline with label, no card wrapper */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="template-name"
            className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground font-[family-name:var(--font-space-grotesk)]"
          >
            Template name
          </label>
          <input
            id="template-name"
            type="text"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="block w-full max-w-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
            placeholder="e.g. Standard QC workflow"
          />
        </div>

        {/* Stages — hairline row list */}
        <div className="flex flex-col gap-0">
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground font-[family-name:var(--font-space-grotesk)]">
            Stages
          </h2>

          <div className="divide-y divide-border border-t border-border">
            {editing.stages.map((stage, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-3 py-3"
              >
                {/* Stage number — IBM Plex Mono, fixed width */}
                <span className="w-8 shrink-0 text-center text-xs font-semibold text-primary font-[family-name:var(--font-ibm-plex-mono)]">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Stage name input */}
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) =>
                    updateStage(idx, "name", e.target.value)
                  }
                  className="flex-1 min-w-0 border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="e.g. DNA extraction"
                />

                {/* Role dropdown */}
                <select
                  value={stage.requiredRole}
                  onChange={(e) =>
                    updateStage(idx, "requiredRole", e.target.value)
                  }
                  className="w-40 shrink-0 border border-border bg-background px-3 py-1.5 text-sm text-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                {/* Requires approval checkbox — right-aligned */}
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.isApprovalGate ?? false}
                    onChange={(e) =>
                      updateStage(idx, "isApprovalGate", e.target.checked)
                    }
                    className="size-3.5 rounded border-input"
                  />
                  Requires approval
                </label>

                {/* Reorder arrows at far right */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveStage(idx, -1)}
                    disabled={idx === 0}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    title="Move up"
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStage(idx, 1)}
                    disabled={idx === editing.stages.length - 1}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    title="Move down"
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add stage button */}
          <Button variant="ghost" size="sm" onClick={addStage} className="mt-2 gap-1.5 self-start">
            <Plus className="size-3.5" />
            Add stage
          </Button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => setEditing(null)}
          >
            Cancel
          </Button>
          <Button
            onClick={saveTemplate}
            disabled={saving || !editing.name.trim()}
            className="gap-1.5"
          >
            {saving ? (
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Check className="size-4" />
            )}
            {saving ? "Saving\u2026" : "Save"}
          </Button>
        </div>
      </div>
    );
  }

  function relativeDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // List view
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-[960px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">Templates</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Define the stages a sample goes through
          </p>
        </div>
        <Button onClick={startNew} className="gap-1.5">
          <Plus className="size-4" />
          New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a workflow template to define the stages a sample goes through."
          illustration={<ClipboardIllustration />}
          action={
            <Button onClick={startNew} className="gap-1.5">
              <Plus className="size-4" />
              New template
            </Button>
          }
        >
          <div className="space-y-3">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 font-[family-name:var(--font-space-grotesk)]">
              What is a template?
            </p>
            <div className="border border-border bg-background p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                A template is a reusable workflow that defines the steps a sample follows. Each stage can require a specific role and optionally gate approval.
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["Receipt", "Extraction", "Analysis", "Review", "Report"].map(
                  (name, i, arr) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="shrink-0 border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary font-mono">
                        {String(i + 1).padStart(2, "0")}
                        <span className="ml-1.5">{name}</span>
                      </span>
                      {i < arr.length - 1 && (
                        <div className="w-4 h-px bg-border" />
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="grid gap-2 text-left sm:grid-cols-2">
              <div className="flex items-start gap-2 border border-border bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Role-based access per stage
                </p>
              </div>
              <div className="flex items-start gap-2 border border-border bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Approval gates for critical steps
                </p>
              </div>
              <div className="flex items-start gap-2 border border-border bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Automated background jobs
                </p>
              </div>
              <div className="flex items-start gap-2 border border-border bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Full audit trail on every transition
                </p>
              </div>
            </div>
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="border border-border bg-card">
            {templates.map((t, i) => (
              <div
                key={t.id}
                className={`flex items-center justify-between gap-4 px-4 py-3.5 ${i < templates.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground truncate">{t.name}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto">
                    {t.stages.map((s, si) => (
                      <div key={si} className="flex items-center gap-1.5">
                        <span className="shrink-0 border border-primary/15 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary font-mono leading-tight">
                          {String(si + 1).padStart(2, "0")}
                          <span className="ml-1">{s.name}</span>
                        </span>
                        {si < t.stages.length - 1 && (
                          <span className="text-muted-foreground/40 text-[10px]">&#8594;</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap hidden sm:block">
                    {relativeDate(t.updatedAt)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(t)}
                    className="gap-1.5 text-xs"
                  >
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {templates.length <= 3 && (
            <div className="border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Most labs use 2&#8211;3 templates for different sample types.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={startNew}
                className="mt-3 gap-1.5"
              >
                <Plus className="size-3.5" />
                New template
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
