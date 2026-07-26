"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

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

  const updateStage = (idx: number, field: keyof Stage, value: string | boolean) => {
    if (!editing) return;
    const stages = editing.stages.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    setEditing({ ...editing, stages });
  };

  const saveTemplate = async () => {
    if (!editing || !editing.name.trim() || editing.stages.some((s) => !s.name.trim())) return;
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

  // Backend enforces auth for all API calls — the UI is optimistic
  // If the session is missing, the API will return 401/403
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }

  // Editing mode
  if (editing) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back
            </button>
            <h1 className="text-lg font-semibold">
              {editing.id ? "Edit template" : "New template"}
            </h1>
          </div>
          <Button size="sm" onClick={saveTemplate} disabled={saving || !editing.name.trim()}>
            {saving && <Spinner />}
            {saving ? "Saving\u2026" : "Save"}
          </Button>
        </div>

        {saved && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
            Template saved
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="template-name" className="block text-sm font-medium text-foreground mb-1.5">
            Template name
          </label>
          <input
            id="template-name"
            type="text"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="block w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. Standard QC workflow"
          />
        </div>

        {/* Stages */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Stages</h2>

          {editing.stages.map((stage, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"
            >
              {/* Stage name */}
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Stage name
                </label>
                <input
                  type="text"
                  value={stage.name}
                  onChange={(e) => updateStage(idx, "name", e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. DNA extraction"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Required role
                </label>
                <select
                  value={stage.requiredRole}
                  onChange={(e) => updateStage(idx, "requiredRole", e.target.value)}
                  className="block rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-4 pb-1">
                <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.isApprovalGate ?? false}
                    onChange={(e) => updateStage(idx, "isApprovalGate", e.target.checked)}
                    className="rounded border-input"
                  />
                  Requires approval
                </label>
                <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stage.backgroundJob ?? false}
                    onChange={(e) => updateStage(idx, "backgroundJob", e.target.checked)}
                    className="rounded border-input"
                  />
                  Automated
                </label>
              </div>

              {/* Reorder / delete */}
              <div className="flex items-center gap-1 pb-1 ml-auto">
                <button
                  type="button"
                  onClick={() => moveStage(idx, -1)}
                  disabled={idx === 0}
                  className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  &uarr;
                </button>
                <button
                  type="button"
                  onClick={() => moveStage(idx, 1)}
                  disabled={idx === editing.stages.length - 1}
                  className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  &darr;
                </button>
                <button
                  type="button"
                  onClick={() => removeStage(idx)}
                  disabled={editing.stages.length <= 1}
                  className="rounded px-1.5 py-1 text-xs text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                  title="Delete stage"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}

          <Button variant="ghost" size="sm" onClick={addStage} className="self-start">
            + Add stage
          </Button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Workflow templates</h1>
        <Button size="sm" onClick={startNew}>
          New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12">
          <h2 className="text-base font-medium">No templates yet</h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Create a workflow template to define the stages a sample goes through.
          </p>
          <Button size="sm" className="mt-2" onClick={startNew}>
            New template
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.stages.length} stage{t.stages.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(t)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
