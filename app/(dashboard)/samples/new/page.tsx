"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ArrowLeft, Plus, X } from "lucide-react";

interface Template {
  id: string;
  name: string;
  stages: { name: string }[];
}

interface MetadataEntry {
  key: string;
  value: string;
}

export default function NewSamplePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateId, setTemplateId] = useState("");
  const [metadata, setMetadata] = useState<MetadataEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, []);

  const addMetadataRow = () => setMetadata([...metadata, { key: "", value: "" }]);
  const removeMetadataRow = (i: number) => setMetadata(metadata.filter((_, idx) => idx !== i));
  const updateMetadata = (i: number, field: "key" | "value", val: string) => {
    const next = [...metadata];
    next[i] = { ...next[i], [field]: val };
    setMetadata(next);
  };

  const metadataObj = Object.fromEntries(
    metadata
      .filter((e) => e.key.trim() !== "")
      .map((e) => [e.key.trim(), e.value])
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) {
      setError("Select a workflow template.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowTemplateId: templateId,
          ...(Object.keys(metadataObj).length > 0 ? { metadata: metadataObj } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create sample");
        return;
      }
      router.push(`/samples/${data.id}`);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === templateId);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-[960px] mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/samples"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight font-[family-name:var(--font-space-grotesk)]">
          Register sample
        </h1>
      </div>

      {error && (
        <div className="border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Template selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Workflow template
          </label>
          {loadingTemplates ? (
            <div className="h-10 border border-border bg-background flex items-center px-3">
              <Spinner className="size-4 text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No templates yet.{" "}
              <Link href="/templates" className="text-foreground underline underline-offset-2 hover:text-muted-foreground transition-colors">
                Create one
              </Link>
            </p>
          ) : (
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-10 w-full border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
            >
              <option value="">Select a template&hellip;</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.stages.length} stage{t.stages.length !== 1 ? "s" : ""})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected template stages preview */}
        {selectedTemplate && (
          <div className="border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-2 font-[family-name:var(--font-space-grotesk)]">
              Workflow stages
            </p>
            <ol className="flex flex-col gap-1.5">
              {selectedTemplate.stages.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="flex-none w-5 h-5 flex items-center justify-center border border-border bg-background text-[10px] font-semibold text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  {s.name}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Metadata */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-foreground">
              Metadata <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <button
              type="button"
              onClick={addMetadataRow}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="size-3" />
              Add field
            </button>
          </div>
          {metadata.length === 0 && (
            <p className="text-xs text-muted-foreground/70">
              Add key-value pairs to attach extra information to this sample.
            </p>
          )}
          <div className="flex flex-col gap-2 mt-2">
            {metadata.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={entry.key}
                  onChange={(e) => updateMetadata(i, "key", e.target.value)}
                  className="h-9 flex-1 border border-border bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={entry.value}
                  onChange={(e) => updateMetadata(i, "value", e.target.value)}
                  className="h-9 flex-1 border border-border bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring"
                />
                <button
                  type="button"
                  onClick={() => removeMetadataRow(i)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting} className="gap-1.5">
            {submitting ? <Spinner className="size-4" /> : <Plus className="size-4" />}
            {submitting ? "Registering\u2026" : "Register sample"}
          </Button>
          <Link
            href="/samples"
            className="h-9 inline-flex items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
