import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "eligible" | "partial" | "ineligible" | "category" | "info" | "high" | "medium" | "low";
}

const variantClasses: Record<string, string> = {
  eligible: "bg-green-100 text-green-800 border border-green-200",
  partial: "bg-amber-100 text-amber-800 border border-amber-200",
  ineligible: "bg-red-100 text-red-800 border border-red-200",
  category: "bg-brand/10 text-brand border border-brand/20",
  info: "bg-slate-100 text-slate-700 border border-slate-200",
  high: "bg-green-100 text-green-700 border border-green-200",
  medium: "bg-blue-100 text-blue-700 border border-blue-200",
  low: "bg-slate-100 text-slate-600 border border-slate-200",
};

export function Badge({ className, variant = "info", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
