import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "blue" | "amber" | "green" | "gray";
}

const accentStyles = {
  blue: {
    icon: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    value: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  green: {
    icon: "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400",
    value: "text-green-600 dark:text-green-400",
  },
  gray: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
};

function StatCard({ label, value, accent = "gray" }: StatCardProps) {
  const styles = accentStyles[accent];
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", styles.icon)}>
        <span className="text-lg font-bold">{typeof value === "number" ? value : value.charAt(0)}</span>
      </div>
      <div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <p className={cn("text-2xl font-semibold tabular-nums", styles.value)}>{value}</p>
      </div>
    </div>
  );
}

export { StatCard };
