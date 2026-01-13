import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  error?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, error, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          error ? "text-[var(--accent-danger)]" : "text-[var(--text-primary)]",
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-1 text-[var(--accent-danger)]">*</span>
        )}
      </label>
    );
  }
);
Label.displayName = "Label";

export { Label };
