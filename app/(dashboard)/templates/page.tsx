"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SkeletonCardGrid, Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ClipboardIllustration } from "@/components/empty-state";
import {
  Plus,
  ArrowLeft,
  Trash2,
  ChevronUp,
  ChevronDown,
  Settings2,
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
    setEditing({ id: "", name: "", stages: [emptyStage()] });
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
      <div className="flex flex-col gap-6 p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <SkeletonCardGrid count={6} />
      </div>
    );
  }

  // Editing mode
  if (editing) {
    return (
      <div className="flex flex-col gap-6 p-6 lg:p-8">
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
            <h1 className="text-xl font-semibold tracking-tight">
              {editing.id ? "Edit template" : "New template"}
            </h1>
          </div>
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
            {saving ? "Saving\u2026" : "Save template"}
          </Button>
        </div>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800/50 dark:bg-green-950/50 dark:text-green-400">
            <Check className="size-4" />
            Template saved successfully
          </div>
        )}

        {/* Name */}
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <label
            htmlFor="template-name"
            className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Template name
          </label>
          <input
            id="template-name"
            type="text"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="block w-full max-w-md rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
            placeholder="e.g. Standard QC workflow"
          />
        </div>

        {/* Stages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Stages
            </h2>
            <Button variant="ghost" size="sm" onClick={addStage} className="gap-1.5">
              <Plus className="size-3.5" />
              Add stage
            </Button>
          </div>

          {editing.stages.map((stage, idx) => (
            <div
              key={idx}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-sm sm:flex-row sm:items-end"
            >
              {/* Stage number */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                {idx + 1}
              </div>

              {/* Stage name */}
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Stage name
                </label>
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) =>
                    updateStage(idx, "name", e.target.value)
                  }
                  className="block w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="e.g. DNA extraction"
                />
              </div>

              {/* Role */}
              <div className="w-full sm:w-auto">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Required role
                </label>
                <select
                  value={stage.requiredRole}
                  onChange={(e) =>
                    updateStage(idx, "requiredRole", e.target.value)
                  }
                  className="block w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground transition-shadow focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.isApprovalGate ?? false}
                    onChange={(e) =>
                      updateStage(idx, "isApprovalGate", e.target.checked)
                    }
                    className="size-3.5 rounded border-input"
                  />
                  Approval gate
                </label>
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.backgroundJob ?? false}
                    onChange={(e) =>
                      updateStage(idx, "backgroundJob", e.target.checked)
                    }
                    className="size-3.5 rounded border-input"
                  />
                  Automated
                </label>
              </div>

              {/* Reorder / delete */}
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
                <button
                  type="button"
                  onClick={() => removeStage(idx)}
                  disabled={editing.stages.length <= 1}
                  className="rounded-md p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                  title="Delete stage"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Templates</h1>
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
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
              What is a template?
            </p>
            <div className="rounded-xl border bg-background p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                A template is a reusable workflow that defines the steps a sample follows. Each stage can require a specific role and optionally gate approval.
              </p>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["Receipt", "Extraction", "Analysis", "Review", "Report"].map(
                  (name, i, arr) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="shrink-0 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        {name}
                      </span>
                      {i < arr.length - 1 && (
                        <span className="text-xs text-muted-foreground/40">
                          &rarr;
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="grid gap-2 text-left sm:grid-cols-2">
              <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Role-based access per stage
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Approval gates for critical steps
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Automated background jobs
                </p>
              </div>
              <div className="flex items-start gap-2 rounded-lg bg-background p-3">
                <Check className="size-4 mt-0.5 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Full audit trail on every transition
                </p>
              </div>
            </div>
          </div>
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => startEdit(t)}
              className="group flex flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left shadow-xs transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Settings2 className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t.stages.length} stage{t.stages.length !== 1 ? "s" : ""}
                </p>
              </div>
              {/* Mini pipeline preview */}
              <div className="flex items-center gap-1 w-full">
                {t.stages.slice(0, 4).map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground truncate max-w-[100px]">
                      {s.name || `Stage ${i + 1}`}
                    </span>
                    {i < Math.min(t.stages.length, 4) - 1 && (
                      <span className="text-[10px] text-muted-foreground/40">&rarr;</span>
                    )}
                  </div>
                ))}
                {t.stages.length > 4 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{t.stages.length - 4}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
