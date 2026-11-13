import { cn } from "@/lib/utils";

const tones = {
  default: "bg-ink-700 text-slate-200",
  success: "bg-mint/20 text-mint",
  warning: "bg-flame/20 text-flame",
  danger: "bg-coral/20 text-coral",
  info: "bg-sky/20 text-sky",
  brand: "bg-coin text-ink-950",
} as const;

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
