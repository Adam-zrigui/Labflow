"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold tracking-tight">LabFlow Dashboard</h1>
      <p className="text-muted-foreground max-w-md text-center">
        Welcome to LabFlow. Manage samples, workflows, and your lab operations.
      </p>
      <div className="flex gap-4">
        <Link
          href="/dashboard/samples"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium text-primary-foreground whitespace-nowrap transition-all hover:bg-primary/80"
        >
          View Samples
        </Link>
        <Link
          href="/dashboard/templates"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-all hover:bg-muted hover:text-foreground"
        >
          Templates
        </Link>
      </div>
    </div>
  );
}
