import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "blue" | "amber" | "green" | "gray";
}

const accentColors = {
  blue: "text-blue-600 dark:text-blue-400",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-green-600 dark:text-green-400",
  gray: "text-foreground",
};

function StatCard({ label, value, accent = "gray" }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-card p-4">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-2xl font-semibold tabular-nums", accentColors[accent])}>
        {value}
      </span>
    </div>
  );
}

export { StatCard };
