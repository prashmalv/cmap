import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-brand text-white hover:bg-brand-dark shadow-md hover:shadow-lg focus-visible:ring-brand",
        outline: "border-2 border-brand text-brand hover:bg-brand hover:text-white",
        ghost: "text-brand hover:bg-brand/10",
        saffron: "bg-saffron text-white hover:bg-saffron/90 shadow-md",
        success: "bg-green-600 text-white hover:bg-green-700",
        danger: "bg-red-600 text-white hover:bg-red-700",
        muted: "bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
      size: {
        sm: "text-sm px-3 py-1.5",
        md: "text-sm px-4 py-2",
        lg: "text-base px-6 py-3",
        xl: "text-lg px-8 py-4",
        icon: "w-9 h-9",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
