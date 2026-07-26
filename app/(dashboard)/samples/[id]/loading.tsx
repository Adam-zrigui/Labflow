import { Skeleton, SkeletonTimeline } from "@/components/ui/skeleton";

export default function SampleLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Back link */}
      <div className="h-4 w-24 rounded bg-muted animate-pulse" />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-7 w-28 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
          </div>
          <div className="h-4 w-40 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Progress stepper */}
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="h-3 w-36 rounded bg-muted animate-pulse mb-4" />
        <div className="h-1.5 w-full rounded-full bg-muted animate-pulse mb-5" />
        <div className="flex items-start gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="h-3 w-20 rounded bg-muted animate-pulse mb-4" />
        <SkeletonTimeline entries={3} />
      </div>
    </div>
  );
}
