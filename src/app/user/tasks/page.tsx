"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Brain,
  Camera,
  Clock,
  Download,
  ExternalLink,
  Gift,
  Keyboard,
  PlayCircle,
  Search,
  Share2,
  ShieldCheck,
  ThumbsUp,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Textarea } from "@/components/ui/input";
import { tasksService, type QuestSession } from "@/services/tasks.service";
import { useConfigStore } from "@/store/config-store";
import { useAuthStore } from "@/store/auth-store";
import { cn, formatCurrency } from "@/lib/utils";
import type { QuestAnswers, Task, TaskCategory } from "@/types";

const categories: Array<{ id: TaskCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "social", label: "Social" },
  { id: "youtube", label: "YouTube" },
  { id: "video", label: "Watch" },
  { id: "survey", label: "Surveys" },
  { id: "daily", label: "Daily" },
  { id: "quiz", label: "Quizzes" },
  { id: "app_install", label: "Apps" },
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
  app_install: { icon: Download, tone: "bg-sky" },
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
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <Input
            aria-label="Search quests"
            placeholder="Search quests"
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              aria-pressed={category === cat.id}
              className={cn(
                "h-9 shrink-0 rounded-lg border px-4 text-sm font-semibold transition-colors",
                category === cat.id
                  ? "border-coin bg-coin/10 text-coin"
                  : "border-ink-700/80 bg-ink-900 text-slate-300 hover:border-ink-600 hover:text-white",
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!questsOpen ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-flame/40 bg-flame/10 p-4 text-sm font-medium text-flame">
            <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            Quests are paused for a moment. Check back soon.
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <EmptyState
            title="No quests here"
            description="Try another category or clear your search. New quests are added every day."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => {
              const l = look[task.category] ?? { icon: Gift, tone: "bg-coin/10 text-coin" };
              const Icon = l.icon;
              return (
                <article
                  key={task.id}
                  className="flex flex-col rounded-xl border border-ink-700/80 bg-ink-900 p-4 shadow-sm shadow-black/20"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
                        l.tone,
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-lg leading-tight text-white">{task.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-400">{task.description}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone="info" className="tabular">+{task.xpReward} XP</Badge>
                    {task.requiresScreenshot ? (
                      <Badge tone="warning">
                        <Camera className="h-3 w-3" aria-hidden="true" /> Needs proof
                      </Badge>
                    ) : (
                      <Badge tone="success">Paid instantly</Badge>
                    )}
                    {task.spec?.questions ? (
                      <Badge className="tabular">{task.spec.questions.length} questions</Badge>
                    ) : null}
                    {task.timeLimitMinutes ? (
                      <Badge>
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        <span className="tabular">{task.timeLimitMinutes} min</span>
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink-700/80 pt-4">
                    <span className="tabular flex items-center gap-1.5 font-display text-xl text-coin">
                      <Coin size={22} />
                      {formatCurrency(task.reward)}
                    </span>
                    <Button size="sm" onClick={() => setSelected(task)}>
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
  const [answers, setAnswers] = useState<QuestAnswers>({});
  const [typed, setTyped] = useState("");
  const auto = task.category === "survey" || task.category === "quiz" || task.category === "typing";

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
      ...(auto
        ? task.category === "typing"
          ? { typed }
          : { answers }
        : { proofUrl: proofUrl || undefined, notes: notes || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error.message);
      if (res.error.code === "SESSION_EXPIRED" || res.error.code === "QUIZ_FAILED_FINAL") setSession(null);
      if (res.error.code === "QUIZ_FAILED_FINAL") onSent();
      return;
    }
    toast.success(
      res.data.status === "approved"
        ? `Correct! ${formatCurrency(task.reward)} added to your wallet.`
        : "Quest sent! We'll review it soon.",
    );
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
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-ink-700/80 bg-ink-900 p-5 sm:rounded-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-coin">Quest</p>
            <h2 className="font-display text-xl leading-tight text-white">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink-800 text-white transition-colors hover:bg-ink-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-ink-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">How to do it</p>
          <p className="mt-1 whitespace-pre-line text-sm font-semibold text-slate-200">{task.instructions}</p>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-lg border border-mint/30 bg-mint/10 p-3 text-xs font-medium text-mint">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
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
                "rounded-lg border p-3 text-center",
                ready ? "border-mint/40 bg-mint/10 text-mint" : "border-coin/40 bg-coin/10 text-coin",
              )}
              aria-live="polite"
            >
              {ready ? (auto ? "Ready. Send your answers." : "Ready. Send your proof.") : `${auto ? "Take your time" : "Finish the steps"}. Sending unlocks in ${waitSeconds}s`}
              {timeLeft !== null ? (
                <p className="tabular mt-0.5 text-xs font-medium text-slate-300">
                  Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </p>
              ) : null}
            </div>
            {task.targetUrl ? (
              <a
                href={task.targetUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({ variant: "sky", size: "sm" })}
              >
                Open link again <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            ) : null}
            {task.category === "typing" ? (
              <div>
                <Label htmlFor="typed">Type this text</Label>
                <p className="mb-2 select-none rounded-lg bg-ink-800 p-3 text-sm font-semibold text-white">{task.spec?.phrase}</p>
                <Textarea
                  id="typed"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
                <p className="mt-1.5 text-xs text-slate-500">Pasting is turned off. Type it yourself.</p>
              </div>
            ) : auto ? (
              <QuestionList task={task} answers={answers} onChange={setAnswers} />
            ) : (
              <>
                <div>
                  <Label htmlFor="proof">Proof link {task.requiresScreenshot ? "(required)" : "(optional)"}</Label>
                  <Input
                    id="proof"
                    placeholder="https://..."
                    inputMode="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    required={task.requiresScreenshot}
                  />
                  <p className="mt-1.5 text-xs text-slate-500">
                    Link to your screenshot or post. Each proof can only be used once.
                  </p>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" placeholder="Anything we should know?" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </>
            )}
            <Button type="submit" size="lg" className="w-full" disabled={submitting || !ready}>
              {submitting ? "Sending…" : ready ? `Claim ${formatCurrency(task.reward)}` : `Wait ${waitSeconds}s`}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function QuestionList({
  task,
  answers,
  onChange,
}: {
  task: Task;
  answers: QuestAnswers;
  onChange: (next: QuestAnswers) => void;
}) {
  const set = (id: string, value: string | number | string[]) => onChange({ ...answers, [id]: value });
  return (
    <div className="space-y-4">
      {(task.spec?.questions ?? []).map((q, i) => (
        <fieldset key={q.id} className="space-y-2 rounded-lg bg-ink-800 p-3">
          <legend className="px-1 font-display text-base text-white">
            {i + 1}. {q.text}
          </legend>
          {q.kind === "text" ? (
            <Input aria-label={q.text} maxLength={500} value={String(answers[q.id] ?? "")} onChange={(e) => set(q.id, e.target.value)} required />
          ) : null}
          {q.kind === "rating" ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} out of 5`}
                  aria-pressed={answers[q.id] === n}
                  onClick={() => set(q.id, n)}
                  className={cn(
                    "h-11 flex-1 rounded-lg border font-display text-lg",
                    answers[q.id] === n ? "border-ink-950 bg-coin text-ink-950" : "border-ink-600 bg-ink-900 text-slate-300",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : null}
          {q.kind === "choice" || q.kind === "multi"
            ? q.options?.map((opt) => {
                const multi = q.kind === "multi";
                const current = answers[q.id];
                const checked = multi ? Array.isArray(current) && current.includes(opt) : current === opt;
                return (
                  <label
                    key={opt}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-semibold",
                      checked ? "border-coin bg-coin/10 text-white" : "border-ink-600 bg-ink-900 text-slate-300",
                    )}
                  >
                    <input
                      type={multi ? "checkbox" : "radio"}
                      name={q.id}
                      className="h-5 w-5 accent-[#ffc21a]"
                      checked={checked}
                      onChange={() => {
                        if (!multi) return set(q.id, opt);
                        const list = Array.isArray(current) ? current : [];
                        set(q.id, checked ? list.filter((o) => o !== opt) : [...list, opt]);
                      }}
                    />
                    {opt}
                  </label>
                );
              })
            : null}
        </fieldset>
      ))}
    </div>
  );
}
