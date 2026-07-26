import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "blue" | "amber" | "green" | "gray";
}

const accentStyles = {
  blue: {
    icon: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    value: "text-foreground",
  },
  amber: {
    icon: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    value: "text-foreground",
  },
  green: {
    icon: "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/50 dark:text-green-400",
    value: "text-foreground",
  },
  gray: {
    icon: "border-border bg-muted text-muted-foreground",
    value: "text-foreground",
  },
};

function StatCard({ label, value, accent = "gray" }: StatCardProps) {
  const styles = accentStyles[accent];
  return (
    <div className="flex items-center gap-4 border border-border bg-card p-4">
      <div className={cn("flex size-10 shrink-0 items-center justify-center border", styles.icon)}>
        <span className="text-lg font-bold font-[family-name:var(--font-space-grotesk)]">{typeof value === "number" ? value : value.charAt(0)}</span>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <p className={cn("text-2xl font-semibold tabular-nums font-[family-name:var(--font-space-grotesk)]", styles.value)}>{value}</p>
      </div>
    </div>
  );
}

export { StatCard };
