import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 bg-muted animate-pulse" />
          <div className="h-4 w-48 bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-32 bg-muted animate-pulse" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Table */}
      <SkeletonTable rows={5} />
    </div>
  );
}
