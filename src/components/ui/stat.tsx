import { cn } from "@/lib/utils";

const tones = {
  coin: "bg-coin/15 text-coin",
  mint: "bg-mint/15 text-mint",
  sky: "bg-sky/15 text-sky",
  flame: "bg-flame/15 text-flame",
  coral: "bg-coral/15 text-coral",
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "coin",
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-3xl border-2 border-ink-700 bg-ink-900 p-4 shadow-[0_5px_0_0_var(--color-ink-700)]",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
            tones[tone],
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="truncate font-display text-2xl leading-tight text-white">
          {value}
        </p>
        {hint ? <p className="truncate text-xs text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}
