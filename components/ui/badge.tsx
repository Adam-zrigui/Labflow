import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap border",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-secondary-foreground",
        inProgress:
          "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        completed:
          "border-transparent bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        flagged:
          "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        pending:
          "border-transparent bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
        active:
          "border-transparent bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
        pastDue:
          "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        canceled:
          "border-transparent bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
        automated:
          "border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        outline: "border-border text-foreground",
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
