import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-display text-base tracking-wide transition-[transform,box-shadow,background-color] duration-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coin/40 disabled:pointer-events-none disabled:opacity-50 active:translate-y-[3px]",
  {
    variants: {
      variant: {
        default:
          "bg-coin text-ink-950 shadow-[0_4px_0_0_var(--color-coin-deep)] hover:bg-[#ffcf4a] active:shadow-[0_1px_0_0_var(--color-coin-deep)]",
        mint: "bg-mint text-ink-950 shadow-[0_4px_0_0_var(--color-mint-deep)] hover:bg-[#52e096] active:shadow-[0_1px_0_0_var(--color-mint-deep)]",
        sky: "bg-sky text-ink-950 shadow-[0_4px_0_0_var(--color-sky-deep)] hover:bg-[#62c4ff] active:shadow-[0_1px_0_0_var(--color-sky-deep)]",
        secondary:
          "border-2 border-ink-600 bg-ink-800 text-white shadow-[0_4px_0_0_var(--color-ink-600)] hover:bg-ink-700 active:shadow-[0_1px_0_0_var(--color-ink-600)]",
        outline:
          "border-2 border-coin text-coin hover:bg-coin/10 active:translate-y-px",
        ghost:
          "text-slate-300 hover:bg-ink-800 hover:text-white active:translate-y-px",
        danger:
          "bg-coral text-white shadow-[0_4px_0_0_var(--color-coral-deep)] hover:bg-[#ff7673] active:shadow-[0_1px_0_0_var(--color-coral-deep)]",
        white:
          "bg-white text-ink-950 shadow-[0_4px_0_0_#b8bdd9] hover:bg-slate-100 active:shadow-[0_1px_0_0_#b8bdd9]",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 rounded-xl px-3.5 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "h-11 w-11 rounded-xl",
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
