"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bot, Play, Send, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminService, type AiRun, type AiStatus } from "@/services/admin.service";
import { relativeTime } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string; actions?: { tool: string; summary: string }[] };

const ideas = [
  "Give me today's summary",
  "Check the proofs waiting and clear the easy ones",
  "Create 3 new quests for today",
  "Are there advertiser quests waiting?",
];

export default function AdminAssistantPage() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res = await adminService.aiStatus();
    if (res.ok) setStatus(res.data);
    else toast.error(res.error.message);
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const send = async (value: string) => {
    const content = value.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setText("");
    setBusy(true);
    const res = await adminService.aiChat(next.map((m) => ({ role: m.role, content: m.content })));
    setBusy(false);
    if (res.ok) {
      setMessages([...next, { role: "assistant", content: res.data.text || "Done.", actions: res.data.actions }]);
    } else {
      toast.error(res.error.message);
      setMessages(next.slice(0, -1));
      setText(content);
    }
  };

  const toggle = async () => {
    if (!status) return;
    setSaving(true);
    const res = await adminService.saveSettings({ aiAutopilot: !status.enabled });
    setSaving(false);
    if (res.ok) {
      setStatus({ ...status, enabled: res.data.aiAutopilot });
      toast.success(res.data.aiAutopilot ? "Autopilot is on. It runs every morning." : "Autopilot is off.");
    } else toast.error(res.error.message);
  };

  const runNow = async () => {
    setRunning(true);
    const res = await adminService.aiRun();
    setRunning(false);
    if (res.ok) {
      if (res.data.error) toast.error(res.data.error);
      else toast.success(`Done. ${res.data.actions.length} action(s) taken.`);
      void load();
    } else toast.error(res.error.message);
  };

  if (!status) {
    return (
      <DashboardShell role="admin" title="AI Manager">
        <Loading />
      </DashboardShell>
    );
  }

  const last: AiRun | undefined = status.runs[0];

  return (
    <DashboardShell role="admin" title="AI Manager">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="flex min-h-[32rem] flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-coin" /> Talk to your manager
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            {!status.configured && (
              <p className="rounded-lg bg-coral/10 p-3 text-sm font-semibold text-coral">
                AI is not connected yet. Add OPENAI_API_KEY in Vercel, then redeploy.
              </p>
            )}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Ask in plain words. Try one of these.</p>
                  <div className="flex flex-wrap gap-2">
                    {ideas.map((idea) => (
                      <button key={idea} type="button" onClick={() => void send(idea)} className="rounded-full bg-ink-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-ink-700">
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-lg bg-coin px-4 py-2.5 text-sm font-semibold text-ink-950" : "mr-auto max-w-[92%] rounded-lg bg-ink-800 px-4 py-2.5 text-sm font-semibold text-slate-100"}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.actions && m.actions.length > 0 && (
                    <ul className="mt-2 space-y-1 border-t border-ink-600 pt-2 text-xs text-mint">
                      {m.actions.map((a, j) => (
                        <li key={j}>• {a.summary}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {busy && <p className="text-sm text-slate-400">Working on it, this can take a minute…</p>}
              <div ref={bottom} />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(text);
              }}
              className="flex gap-2"
            >
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell the AI what to do" disabled={busy} />
              <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Send">
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-coin" /> Autopilot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-semibold text-slate-300">
                Every morning the AI approves advertiser quests, clears safe proofs, rejects clear fakes and keeps quests stocked. Money, payouts and suspensions always stay with you.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant={status.enabled ? "mint" : "secondary"} onClick={() => void toggle()} disabled={saving}>
                  {status.enabled ? "Autopilot is ON" : "Turn autopilot on"}
                </Button>
                <Button variant="outline" onClick={() => void runNow()} disabled={running || !status.configured}>
                  <Play className="h-4 w-4" /> {running ? "Running…" : "Run now"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">Set the limits in Settings, under AI.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Last runs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!last && <p className="text-sm text-slate-400">No runs yet.</p>}
              {status.runs.slice(0, 5).map((run) => (
                <div key={run.id} className="rounded-lg bg-ink-800 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-400">{relativeTime(run.startedAt)} · {run.trigger === "cron" ? "automatic" : "by you"}</p>
                    <Badge tone={run.error ? "danger" : "success"}>{run.error ? "failed" : `${run.actions.length} actions`}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-semibold text-slate-200">{run.error ?? run.report}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
