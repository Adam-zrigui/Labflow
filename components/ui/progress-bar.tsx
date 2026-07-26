import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
}

function ProgressBar({ value, max, label }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  const isNearLimit = pct >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium tabular-nums text-foreground">
          {value} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isNearLimit ? "bg-amber-500" : "bg-blue-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export { ProgressBar };
