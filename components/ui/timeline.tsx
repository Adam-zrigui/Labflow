import { cn } from "@/lib/utils";

interface TimelineEntryProps {
  timestamp: string;
  actor: string;
  description: string;
  type: "stage" | "audit";
  color?: "blue" | "green" | "amber" | "gray";
  muted?: boolean;
}

const sealColors: Record<string, string> = {
  blue: "border-primary bg-primary/10 text-primary",
  green: "border-green-600 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-950/50 dark:text-green-400",
  amber: "border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/50 dark:text-amber-400",
  gray: "border-border bg-muted text-muted-foreground",
};

const outcomeStamp: Record<string, { label: string; cls: string }> = {
  flagged: { label: "FLAGGED", cls: "text-amber-600 border-amber-600 dark:text-amber-400 dark:border-amber-500" },
  pass: { label: "PASSED", cls: "text-green-700 border-green-600 dark:text-green-400 dark:border-green-500" },
  entered: { label: "ENTERED", cls: "text-primary border-primary" },
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
  const sealColor = muted
    ? "border-border bg-muted text-muted-foreground"
    : (sealColors[color] ?? sealColors.gray);

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {/* Vertical connecting line + seal */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
            sealColor
          )}
        >
          <div className="size-1.5 rounded-full bg-current" />
        </div>
        <div className="custody-line" />
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 pt-0.5", muted && "opacity-50")}>
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              "text-sm",
              isStage
                ? "font-medium text-foreground"
                : "font-mono text-xs text-muted-foreground"
            )}
          >
            {description}
          </p>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            {timestamp}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{actor}</span>
          {!isStage && (
            <span className="stamp-badge text-muted-foreground">
              Audit
            </span>
          )}
        </div>
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
