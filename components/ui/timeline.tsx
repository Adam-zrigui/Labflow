import { cn } from "@/lib/utils";

interface TimelineEntryProps {
  timestamp: string;
  actor: string;
  description: string;
  type: "stage" | "audit";
  color?: "blue" | "green" | "amber" | "gray";
  muted?: boolean;
}

const dotColors: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  gray: "bg-muted-foreground/30",
};

const lineColors: Record<string, string> = {
  blue: "bg-blue-200 dark:bg-blue-900",
  green: "bg-green-200 dark:bg-green-900",
  amber: "bg-amber-200 dark:bg-amber-900",
  gray: "bg-border",
};

function TimelineEntry({
  timestamp,
  actor,
  description,
  type,
  color = "gray",
  muted,
}: TimelineEntryProps) {
  const isStage = type === "stage";
  const dotColor = muted ? "bg-muted-foreground/30" : (dotColors[color] ?? dotColors.gray);
  const lineColor = muted ? "bg-border" : (lineColors[color] ?? lineColors.gray);

  return (
    <div className="relative flex gap-4 pb-5 last:pb-0">
      {/* Vertical line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 size-3 shrink-0 rounded-full ring-2 ring-background",
            dotColor
          )}
        />
        <div className={cn("mt-1 w-px flex-1", lineColor)} />
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 pt-px", muted && "opacity-60")}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <p
              className={cn(
                isStage
                  ? "text-sm font-medium text-foreground"
                  : "text-xs text-muted-foreground"
              )}
            >
              {description}
            </p>
            {!isStage && (
              <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
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
