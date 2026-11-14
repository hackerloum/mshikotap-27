import { cn } from "@/lib/utils";

const tones = {
  coin: "bg-coin/10 text-coin",
  mint: "bg-mint/10 text-mint",
  sky: "bg-sky/10 text-sky",
  flame: "bg-flame/10 text-flame",
  coral: "bg-coral/10 text-coral",
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
        "flex items-center gap-3.5 rounded-xl border border-ink-700/80 bg-ink-900 p-4 shadow-sm shadow-black/20",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
            tones[tone],
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="tabular truncate font-display text-xl leading-tight text-white">
          {value}
        </p>
        {hint ? <p className="truncate text-xs text-slate-400">{hint}</p> : null}
      </div>
    </div>
  );
}
