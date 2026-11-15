import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold tracking-normal transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coin/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-coin text-ink-950 hover:bg-[#ffcf4a] active:bg-coin-deep",
        mint: "bg-mint text-ink-950 hover:bg-[#52e096] active:bg-mint-deep",
        sky: "bg-sky text-ink-950 hover:bg-[#62c4ff] active:bg-sky-deep",
        secondary:
          "border border-ink-600 bg-ink-800 text-white hover:border-ink-600 hover:bg-ink-700",
        outline:
          "border border-coin/60 text-coin hover:bg-coin/10",
        ghost: "text-slate-300 hover:bg-ink-800 hover:text-white",
        danger: "bg-coral text-white hover:bg-[#ff7673] active:bg-coral-deep",
        white: "bg-white text-ink-950 hover:bg-slate-100",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-[13px]",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
