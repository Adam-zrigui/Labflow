import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted animate-shimmer",
        "bg-gradient-to-r from-muted via-muted/60 to-muted",
        className
      )}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-5 shadow-xs", className)}>
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex gap-8">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-8 border-b last:border-0 px-4 py-3"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function SkeletonTimeline({ entries = 4 }: { entries?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: entries }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <Skeleton className="size-2.5 rounded-full" />
            <Skeleton className="mt-1 h-8 w-px" />
          </div>
          <div className="flex-1 space-y-1.5 pt-px">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-xs"
        >
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-12 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonTimeline, SkeletonCardGrid };
