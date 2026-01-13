"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const variantClasses = {
  default: "bg-[var(--accent-primary)]",
  success: "bg-[var(--accent-secondary)]",
  warning: "bg-[var(--accent-warning)]",
  danger: "bg-[var(--accent-danger)]",
};

function getVariantByPercentage(percentage: number): "success" | "warning" | "danger" {
  if (percentage >= 100) return "danger";
  if (percentage >= 80) return "warning";
  return "success";
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      showLabel = false,
      size = "md",
      variant,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const autoVariant = variant || getVariantByPercentage(percentage);

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {showLabel && (
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Progress</span>
            <span className="font-mono text-[var(--text-primary)]">
              {percentage.toFixed(0)}%
            </span>
          </div>
        )}
        <div
          className={cn(
            "w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]",
            sizeClasses[size]
          )}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              variantClasses[autoVariant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };
