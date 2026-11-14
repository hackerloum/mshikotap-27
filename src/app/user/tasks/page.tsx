"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Brain,
  Camera,
  Clock,
  Gift,
  Keyboard,
  PlayCircle,
  Search,
  Share2,
  ShieldCheck,
  ThumbsUp,
  X,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { tasksService, type QuestSession } from "@/services/tasks.service";
import { useConfigStore } from "@/store/config-store";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatCurrency } from "@/lib/utils";
import type { Task, TaskCategory } from "@/types";

const categories: Array<{ id: TaskCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "social", label: "Social" },
  { id: "youtube", label: "YouTube" },
  { id: "video", label: "Watch" },
  { id: "survey", label: "Surveys" },
  { id: "daily", label: "Daily" },
  { id: "typing", label: "Typing" },
];

const look: Record<string, { icon: LucideIcon; tone: string }> = {
  social: { icon: ThumbsUp, tone: "bg-coral" },
  youtube: { icon: PlayCircle, tone: "bg-coral" },
  video: { icon: PlayCircle, tone: "bg-sky" },
  survey: { icon: Brain, tone: "bg-mint" },
  quiz: { icon: Brain, tone: "bg-mint" },
  daily: { icon: Gift, tone: "bg-coin" },
  typing: { icon: Keyboard, tone: "bg-flame" },
  referral: { icon: Share2, tone: "bg-coral" },
  screenshot: { icon: Camera, tone: "bg-sky" },
};

export default function UserTasksPage() {
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TaskCategory | "all">("all");
  const questsOpen = useConfigStore((c) => c.config.questsOpen);
  const [selected, setSelected] = useState<Task | null>(null);

  const load = useCallback(async () => {
    const res = await tasksService.list({ category, query });
    if (res.ok) setTasks(res.data);
  }, [category, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell role="user" title="Quests">
      <div className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
          <Input
            aria-label="Search quests"
            placeholder="Search quests"
            className="pl-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "h-10 shrink-0 rounded-full border-2 px-4 font-display text-base transition active:scale-95",
                category === cat.id
                  ? "border-ink-950 bg-coin text-ink-950"
                  : "border-ink-700 bg-ink-900 text-slate-300 hover:border-ink-600",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!questsOpen ? (
          <div className="rounded-2xl border-2 border-flame/50 bg-flame/10 p-4 text-sm font-bold text-flame">
            Quests are paused for a moment. Check back soon.
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <EmptyState
            title="No quests here"
            description="Try another category or clear your search. New quests land every day."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => {
              const l = look[task.category] ?? { icon: Gift, tone: "bg-coin" };
              const Icon = l.icon;
              return (
                <article
                  key={task.id}
                  className="flex flex-col rounded-3xl border-2 border-ink-700 bg-ink-900 p-4 shadow-[0_5px_0_0_var(--color-ink-700)]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-ink-950 text-ink-950",
                        l.tone,
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl leading-tight text-white">{task.title}</h3>
                      <p className="mt-0.5 text-sm font-semibold text-slate-400">{task.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-extrabold">
                    <span className="rounded-full bg-sky/20 px-2.5 py-1 text-sky">+{task.xpReward} XP</span>
                    {task.requiresScreenshot ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-flame/20 px-2.5 py-1 text-flame">
                        <Camera className="h-3.5 w-3.5" /> Needs proof
                      </span>
                    ) : null}
                    {task.timeLimitMinutes ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ink-700 px-2.5 py-1 text-slate-300">
                        <Clock className="h-3.5 w-3.5" /> {task.timeLimitMinutes} min
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t-2 border-dashed border-ink-700 pt-4">
                    <span className="flex items-center gap-1.5 font-display text-2xl text-coin">
                      <Coin size={26} />
                      {formatCurrency(task.reward)}
                    </span>
                    <Button size="sm" className="h-11 px-5" onClick={() => setSelected(task)}>
                      Start quest
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {selected ? (
          <QuestSheet
            task={selected}
            onClose={() => setSelected(null)}
            onSent={() => {
              void refreshProfile();
              void load();
              setSelected(null);
            }}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}

function QuestSheet({
  task,
  onClose,
  onSent,
}: {
  task: Task;
  onClose: () => void;
  onSent: () => void;
}) {
  const [session, setSession] = useState<QuestSession | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [session]);

  const waitSeconds = useMemo(() => {
    if (!session) return 0;
    const readyAt = new Date(session.readyAt).getTime() - offset;
    return Math.max(0, Math.ceil((readyAt - now) / 1000));
  }, [session, offset, now]);

  const timeLeft = useMemo(() => {
    if (!session?.expiresAt) return null;
    const end = new Date(session.expiresAt).getTime() - offset;
    return Math.max(0, Math.ceil((end - now) / 1000));
  }, [session, offset, now]);

  async function start() {
    setStarting(true);
    const res = await tasksService.start(task.id);
    setStarting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    setOffset(new Date(res.data.serverNow).getTime() - Date.now());
    setNow(Date.now());
    setSession(res.data);
    if (task.targetUrl) window.open(task.targetUrl, "_blank", "noopener,noreferrer");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await tasksService.submit({
      taskId: task.id,
      proofUrl: proofUrl || undefined,
      notes: notes || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      if (res.error.code === "SESSION_EXPIRED") setSession(null);
      return;
    }
    toast.success("Quest sent! We'll review it soon.");
    onSent();
  }

  const ready = session !== null && waitSeconds === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Quest ${task.title}`}
    >
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-2 border-ink-600 bg-ink-900 p-5 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-coin">Quest</p>
            <h2 className="font-display text-2xl leading-tight text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-800 text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-ink-800 p-4">
          <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">How to do it</p>
          <p className="mt-1 text-sm font-semibold text-slate-200">{task.instructions}</p>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-mint/30 bg-mint/10 p-3 text-xs font-bold text-mint">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Play fair. Use your own real proof. Reused, fake or rushed proof is blocked and can get your account suspended.
        </p>

        {!session ? (
          <Button size="lg" className="mt-4 w-full" onClick={() => void start()} disabled={starting}>
            {starting ? "Starting…" : task.targetUrl ? "Start and open link" : "Start quest"}
          </Button>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <div
              className={cn(
                "rounded-2xl border-2 p-3 text-center font-display text-xl",
                ready ? "border-mint/40 bg-mint/10 text-mint" : "border-coin/40 bg-coin/10 text-coin",
              )}
              aria-live="polite"
            >
              {ready ? "Ready. Send your proof." : `Finish the steps. Proof unlocks in ${waitSeconds}s`}
              {timeLeft !== null ? (
                <p className="mt-0.5 font-sans text-xs font-bold text-slate-300">
                  Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </p>
              ) : null}
            </div>
            {task.targetUrl ? (
              <a
                href={task.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center rounded-xl bg-sky px-4 font-display text-ink-950"
              >
                Open link again
              </a>
            ) : null}
            <div>
              <Label htmlFor="proof">
                Proof link {task.requiresScreenshot ? "(required)" : "(optional)"}
              </Label>
              <Input
                id="proof"
                placeholder="https://..."
                inputMode="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                required={task.requiresScreenshot}
              />
              <p className="mt-1.5 text-xs font-semibold text-slate-500">
                Link to your screenshot or post. Each proof can only be used once.
              </p>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Anything we should know?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={submitting || !ready}>
              {submitting ? "Sending…" : ready ? `Claim ${formatCurrency(task.reward)}` : `Wait ${waitSeconds}s`}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
