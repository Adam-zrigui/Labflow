import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "stamp-badge",
  {
    variants: {
      variant: {
        default:
          "border-border text-muted-foreground bg-muted",
        inProgress:
          "border-primary text-primary bg-primary/5",
        completed:
          "border-green-600 text-green-700 bg-green-50 dark:border-green-500 dark:text-green-400 dark:bg-green-950/50",
        flagged:
          "border-amber-600 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:bg-amber-950/50",
        pending:
          "border-border text-muted-foreground bg-muted",
        active:
          "border-green-600 text-green-700 bg-green-50 dark:border-green-500 dark:text-green-400 dark:bg-green-950/50",
        pastDue:
          "border-amber-600 text-amber-700 bg-amber-50 dark:border-amber-500 dark:text-amber-400 dark:bg-amber-950/50",
        canceled:
          "border-border text-muted-foreground bg-muted",
        automated:
          "border-primary text-primary bg-primary/5",
        outline: "border-border text-foreground bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
