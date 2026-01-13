import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
        income:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        expense:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        transfer:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        success:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        warning:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        danger:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        info:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        certain:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        expected:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        predicted:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        planned:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        considering:
          "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
        active:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        paused:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        completed:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        cancelled:
          "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
