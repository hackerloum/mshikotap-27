import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/50 to-transparent" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
          </div>
          {icon ? (
            <div className="rounded-xl bg-teal-400/10 p-2 text-teal-300">
              {icon}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
