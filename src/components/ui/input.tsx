import * as React from "react";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 text-sm font-medium text-white placeholder:text-slate-500 outline-none transition focus:border-coin focus:ring-2 focus:ring-coin/25";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(field, "h-11", className)} {...props} />
));
Input.displayName = "Input";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn(
      "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400",
      className,
    )}
    {...props}
  />
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(field, "min-h-28 py-3", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(field, "h-11", className)} {...props} />
));
Select.displayName = "Select";
