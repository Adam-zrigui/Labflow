import { cn } from "@/lib/utils";

interface TimelineEntryProps {
  timestamp: string;
  actor: string;
  description: string;
  type: "stage" | "audit";
  muted?: boolean;
}

function TimelineEntry({
  timestamp,
  actor,
  description,
  type,
  muted,
}: TimelineEntryProps) {
  const isStage = type === "stage";

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical line */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex size-3 shrink-0 rounded-full border-2",
            muted
              ? "border-muted-foreground/30 bg-background"
              : isStage
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : "border-muted-foreground/30 bg-background"
          )}
        />
        <div className="mt-0.5 w-px flex-1 bg-border" />
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 pt-px", muted && "opacity-60")}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <p
              className={cn(
                isStage ? "text-sm font-medium text-foreground" : "text-xs text-muted-foreground"
              )}
            >
              {description}
            </p>
            {!isStage && (
              <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
                Audit
              </span>
            )}
          </div>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {timestamp}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{actor}</p>
      </div>
    </div>
  );
}

interface TimelineProps {
  children: React.ReactNode;
}

function Timeline({ children }: TimelineProps) {
  return <div className="flex flex-col">{children}</div>;
}

export { Timeline, TimelineEntry };
