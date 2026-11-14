import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
  action,
}: {
  title: string;
  description?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-ink-600 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-ink-800 text-slate-400">
        <Inbox className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="font-display text-lg text-white">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-400">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
