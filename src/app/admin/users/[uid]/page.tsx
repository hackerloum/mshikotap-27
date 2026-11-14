"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, RiskBadge, accountAge, dateTime } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat";
import { flagLabels } from "@/config/system";
import { adminService, type AdminUserDetail, type UserPatch } from "@/services/admin.service";
import { formatCurrency, relativeTime } from "@/lib/utils";

const subTone = { submitted: "warning", approved: "success", rejected: "danger" } as const;

export default function AdminPlayerPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const [data, setData] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [adjust, setAdjust] = useState({ amount: "", reason: "" });
  const [credits, setCredits] = useState("");
  const [message, setMessage] = useState({ title: "", body: "" });

  const load = useCallback(async () => {
    const res = await adminService.user(uid);
    if (res.ok) setData(res.data);
    else setError(res.error.message);
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function apply(patch: UserPatch, success: string) {
    setBusy(true);
    const res = await adminService.updateUser(uid, patch);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return false;
    }
    toast.success(success);
    void load();
    return true;
  }

  async function resolveFlag(id: string, action: "dismiss" | "confirm") {
    const res = await adminService.resolveFlag(id, action);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    toast.success(action === "dismiss" ? "Dismissed" : "Confirmed");
    void load();
  }

  if (error) {
    return (
      <DashboardShell role="admin" title="Player">
        <p className="rounded-2xl border-2 border-coral/40 bg-coral/10 p-4 text-sm font-bold text-coral">{error}</p>
      </DashboardShell>
    );
  }
  if (!data) {
    return (
      <DashboardShell role="admin" title="Player">
        <Loading />
      </DashboardShell>
    );
  }

  const { profile, security } = data;
  const isAdmin = profile.role === "admin";
  const age = Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 3_600_000);

  return (
    <DashboardShell role="admin" title="Player">
      <div className="space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All players
        </Link>

        <Card>
          <CardContent className="space-y-3 pt-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-display text-3xl text-white">{profile.displayName}</h2>
                <p className="break-all text-sm font-semibold text-slate-400">{profile.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{profile.role}</Badge>
                <RiskBadge risk={security.risk} score={security.riskScore} trusted={security.trusted} />
                <Badge tone={profile.isBanned ? "danger" : "success"}>{profile.isBanned ? "suspended" : "active"}</Badge>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Joined {dateTime(profile.createdAt)} ({accountAge(age)}) · referral code {profile.referralCode}
              {profile.referredBy ? ` · referred by ${profile.referredBy}` : ""}
            </p>
            {profile.isBanned && profile.banReason ? (
              <p className="rounded-2xl border-2 border-coral/40 bg-coral/10 p-3 text-sm font-bold text-coral">Suspended: {profile.banReason}</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Balance" value={formatCurrency(profile.wallet.balance)} hint={`${formatCurrency(profile.wallet.pendingBalance)} on hold`} tone="coin" />
          <StatCard label="Lifetime earned" value={formatCurrency(profile.wallet.lifetimeEarnings)} tone="mint" />
          <StatCard label="Quests" value={`${security.approved} / ${security.submitted}`} hint={`${security.rejected} rejected`} tone="sky" />
          <StatCard label="Friends invited" value={String(data.referrals)} hint={`${security.referralPaid} bonuses paid`} tone="flame" />
        </div>

        {data.sameDevice.length > 0 || data.sameIp.length > 0 ? (
          <Card className="border-flame/50">
            <CardHeader>
              <CardTitle>Linked accounts</CardTitle>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                Same device is a strong signal. Same network can be family or a shared phone network.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.sameDevice.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-coral">Same device</p>
                  <div className="flex flex-wrap gap-2">
                    {data.sameDevice.map((a) => (
                      <Link key={a.uid} href={`/admin/users/${a.uid}`} className="rounded-full bg-coral/15 px-3 py-1.5 text-sm font-bold text-coral hover:bg-coral/25">
                        {a.name}
                        {a.isBanned ? " (suspended)" : ""}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
              {data.sameIp.length > 0 ? (
                <div>
                  <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-400">Same network</p>
                  <div className="flex flex-wrap gap-2">
                    {data.sameIp.map((a) => (
                      <Link key={a.uid} href={`/admin/users/${a.uid}`} className="rounded-full bg-ink-800 px-3 py-1.5 text-sm font-bold text-slate-200 hover:bg-ink-700">
                        {a.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isAdmin ? (
                <p className="text-sm font-bold text-slate-400">Admins are managed with the ADMIN_EMAILS setting.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {profile.isBanned ? (
                      <Button variant="mint" className="min-h-11 w-full" disabled={busy} onClick={() => void apply({ isBanned: false }, "Account reinstated")}>
                        Reinstate account
                      </Button>
                    ) : (
                      <>
                        <Label htmlFor="ban">Suspend account</Label>
                        <Input id="ban" placeholder="Reason (the player is told)" value={banReason} onChange={(e) => setBanReason(e.target.value)} />
                        <Button
                          variant="danger"
                          className="min-h-11 w-full"
                          disabled={busy || !banReason.trim()}
                          onClick={async () => {
                            if (await apply({ isBanned: true, banReason }, "Account suspended")) setBanReason("");
                          }}
                        >
                          Suspend
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" className="min-h-11" disabled={busy} onClick={() => void apply({ trusted: !security.trusted }, security.trusted ? "Trust removed" : "Marked as trusted")}>
                      {security.trusted ? "Remove trusted" : "Mark trusted"}
                    </Button>
                    <Button variant="secondary" className="min-h-11" disabled={busy || security.riskScore === 0} onClick={() => void apply({ resetRisk: true }, "Risk reset to 0")}>
                      Reset risk
                    </Button>
                    <Button
                      variant="secondary"
                      className="col-span-2 min-h-11"
                      disabled={busy}
                      onClick={() =>
                        void apply(
                          { role: profile.role === "advertiser" ? "user" : "advertiser" },
                          profile.role === "advertiser" ? "Now a player" : "Now an advertiser",
                        )
                      }
                    >
                      {profile.role === "advertiser" ? "Make player" : "Make advertiser"}
                    </Button>
                  </div>

                  {profile.role === "advertiser" ? (
                    <div className="space-y-2">
                      <Label htmlFor="credits">Advertiser credits ({formatCurrency(profile.advertiserCredits ?? 0)})</Label>
                      <div className="flex gap-2">
                        <Input id="credits" type="number" placeholder="Add TSh" value={credits} onChange={(e) => setCredits(e.target.value)} />
                        <Button
                          variant="sky"
                          className="min-h-12 shrink-0"
                          disabled={busy || !Number(credits)}
                          onClick={async () => {
                            if (await apply({ grantCredits: Number(credits) }, "Credits updated")) setCredits("");
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="adj">Adjust balance</Label>
                    <Input id="adj" type="number" placeholder="TSh, use minus to remove" value={adjust.amount} onChange={(e) => setAdjust({ ...adjust, amount: e.target.value })} />
                    <Input aria-label="Reason" placeholder="Reason (required, kept in the audit log)" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
                    <Button
                      variant="default"
                      className="min-h-11 w-full"
                      disabled={busy || !Number(adjust.amount) || !adjust.reason.trim()}
                      onClick={async () => {
                        if (await apply({ adjustBalance: { amount: Number(adjust.amount), reason: adjust.reason } }, "Balance updated")) {
                          setAdjust({ amount: "", reason: "" });
                        }
                      }}
                    >
                      Apply change
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="msg-title">Send a message</Label>
                    <Input id="msg-title" placeholder="Title" value={message.title} onChange={(e) => setMessage({ ...message, title: e.target.value })} />
                    <Textarea aria-label="Message" placeholder="Message" value={message.body} onChange={(e) => setMessage({ ...message, body: e.target.value })} />
                    <Button
                      variant="secondary"
                      className="min-h-11 w-full"
                      disabled={busy || !message.title.trim() || !message.body.trim()}
                      onClick={async () => {
                        if (await apply({ message }, "Message sent")) setMessage({ title: "", body: "" });
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fraud alerts ({data.flags.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.flags.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No alerts for this player.</p>
              ) : (
                data.flags.map((f) => (
                  <div key={f.id} className="rounded-2xl border-2 border-ink-700 bg-ink-800 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-extrabold text-white">{flagLabels[f.kind] ?? f.kind}</p>
                      <Badge tone={f.status === "open" ? (f.severity === "high" ? "danger" : "warning") : "default"}>
                        {f.status === "open" ? f.severity : f.status}
                      </Badge>
                    </div>
                    <p className="mt-1 break-words text-xs font-semibold text-slate-300">{f.detail}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {relativeTime(f.createdAt)}
                      {f.points ? ` · ${f.points > 0 ? "+" : ""}${f.points} risk` : ""}
                    </p>
                    {f.status === "open" ? (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button size="sm" variant="secondary" className="min-h-10" onClick={() => void resolveFlag(f.id, "dismiss")}>
                          False alarm
                        </Button>
                        <Button size="sm" variant="danger" className="min-h-10" onClick={() => void resolveFlag(f.id, "confirm")}>
                          Confirm
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent quests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.submissions.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No quests sent yet.</p>
              ) : (
                data.submissions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{s.taskTitle ?? s.taskId}</p>
                      <p className="text-xs font-semibold text-slate-400">
                        {formatCurrency(s.reward ?? 0)} · {relativeTime(s.submittedAt)}
                        {typeof s.elapsedSeconds === "number" ? ` · ${s.elapsedSeconds}s` : ""}
                      </p>
                    </div>
                    <Badge tone={subTone[s.status]}>{s.status === "submitted" ? "waiting" : s.status}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payouts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.withdrawals.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">No cash outs yet.</p>
              ) : (
                data.withdrawals.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-2 rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">
                        {formatCurrency(w.amount)} · {w.destination}
                      </p>
                      <p className="text-xs font-semibold text-slate-400">{relativeTime(w.createdAt)}</p>
                    </div>
                    <Badge tone={w.status === "completed" ? "success" : w.status === "rejected" ? "danger" : "warning"}>
                      {w.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin history for this player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.audit.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">No admin actions yet.</p>
            ) : (
              data.audit.map((a) => (
                <div key={a.id} className="rounded-2xl border-2 border-ink-700 bg-ink-800 px-3 py-2.5">
                  <p className="break-words text-sm font-semibold text-slate-200">
                    <span className="font-extrabold text-coin">{a.actorName}</span> · {a.summary}
                  </p>
                  <p className="text-xs font-semibold text-slate-500">{dateTime(a.createdAt)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
