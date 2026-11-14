"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/config/system";
import type { PlayerContext } from "@/services/admin.service";

const riskTone: Record<RiskLevel, "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export function RiskBadge({ risk, score, trusted }: { risk: RiskLevel; score?: number; trusted?: boolean }) {
  if (trusted) return <Badge tone="info">trusted</Badge>;
  return (
    <Badge tone={riskTone[risk]}>
      {risk} risk{typeof score === "number" ? ` · ${score}` : ""}
    </Badge>
  );
}

export function accountAge(hours: number) {
  if (hours < 1) return "new today";
  if (hours < 48) return `${hours}h old`;
  return `${Math.floor(hours / 24)}d old`;
}

export function PlayerChip({ player, fallback }: { player: PlayerContext | null; fallback?: string }) {
  if (!player) return <span className="text-sm font-bold text-slate-400">{fallback ?? "Unknown player"}</span>;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Link
        href={`/admin/users/${player.uid}`}
        className="font-display text-lg leading-tight text-white underline-offset-4 hover:text-coin hover:underline"
      >
        {player.name}
      </Link>
      <RiskBadge risk={player.risk} score={player.riskScore} trusted={player.trusted} />
      {player.isBanned ? <Badge tone="danger">suspended</Badge> : null}
      <span className="text-xs font-semibold text-slate-400">
        {accountAge(player.accountAgeHours)} · {player.approved} approved · {player.rejected} rejected
      </span>
    </div>
  );
}

export function PillTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: string; count?: number }>;
}) {
  return (
    <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "h-10 shrink-0 rounded-full border-2 px-4 font-display text-base transition active:scale-95",
            value === o.id
              ? "border-ink-950 bg-coin text-ink-950"
              : "border-ink-700 bg-ink-900 text-slate-300 hover:border-ink-600",
          )}
        >
          {o.label}
          {typeof o.count === "number" ? <span className="ml-1.5 opacity-70">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border-2 border-ink-700 bg-ink-800 px-4 py-3 text-left transition hover:border-ink-600 disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block font-display text-lg text-white">{label}</span>
        {hint ? <span className="block text-xs font-semibold text-slate-400">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full border-2 transition",
          checked ? "border-mint-deep bg-mint" : "border-ink-600 bg-ink-950",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all",
            checked ? "left-[26px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function ProofLink({ url }: { url?: string }) {
  const [preview, setPreview] = useState(false);
  if (!url) return <p className="text-sm font-semibold text-slate-500">No proof link sent</p>;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex max-w-full items-center gap-1.5 truncate rounded-xl bg-sky/15 px-3 py-1.5 text-sm font-bold text-sky hover:bg-sky/25"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
        </a>
        <button
          onClick={() => setPreview((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-ink-800 px-3 text-xs font-extrabold text-slate-300 hover:bg-ink-700"
        >
          <ImageIcon className="h-4 w-4" />
          {preview ? "Hide preview" : "Preview image"}
        </button>
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Submitted proof"
          referrerPolicy="no-referrer"
          className="max-h-80 w-full rounded-2xl border-2 border-ink-700 bg-ink-950 object-contain"
        />
      ) : null}
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return <p className="py-6 text-center text-sm font-semibold text-slate-400">{label}</p>;
}

export function dateTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
