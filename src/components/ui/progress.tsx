import { cn } from "@/lib/utils";

const fills = {
  mint: "bg-mint",
  coin: "bg-coin",
  sky: "bg-sky",
  flame: "bg-flame",
} as const;

export function ProgressBar({
  value,
  max = 100,
  tone = "mint",
  className,
  label,
}: {
  value: number;
  max?: number;
  tone?: keyof typeof fills;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-ink-800", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700", fills[tone])}
        style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
}
