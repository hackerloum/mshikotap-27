import { cn } from "@/lib/utils";

const tones = {
  default: "bg-ink-700 text-slate-200",
  success: "bg-mint/15 text-mint",
  warning: "bg-flame/15 text-flame",
  danger: "bg-coral/15 text-coral",
  info: "bg-sky/15 text-sky",
  brand: "bg-coin/15 text-coin",
} as const;

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
