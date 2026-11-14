"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Loading, Toggle } from "@/components/admin/parts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { defaultSettings, type SystemSettings } from "@/config/system";
import { siteConfig } from "@/config/site";
import { adminService } from "@/services/admin.service";

type NumKey = Exclude<keyof SystemSettings, "signupsOpen" | "questsOpen" | "withdrawalsOpen" | "announcement">;

type Field = { key: NumKey; label: string; hint: string; step?: string };

const groups: Array<{ title: string; description: string; fields: Field[] }> = [
  {
    title: "Money and rewards",
    description: "What players earn and what a cash out costs.",
    fields: [
      { key: "minWithdrawal", label: "Minimum cash out (TSh)", hint: "Players cannot cash out less than this." },
      { key: "withdrawalFeePercent", label: "Cash out fee (%)", hint: "Taken from each payout.", step: "0.1" },
      { key: "referralBonus", label: "Referral bonus (TSh)", hint: "Paid when a friend gets their first quest approved." },
      { key: "maxReferralBonuses", label: "Max paid referrals per player", hint: "Stops referral farming." },
      { key: "dailyBonusBase", label: "Daily bonus base (TSh)", hint: "Starting daily reward." },
      { key: "dailyBonusStep", label: "Daily bonus per streak day (TSh)", hint: "Added for each day, up to day 7." },
    ],
  },
  {
    title: "Quest limits",
    description: "Slow down bots and rushed claims.",
    fields: [
      { key: "minSecondsToSubmit", label: "Min seconds before proof", hint: "Default wait after starting a quest. A quest can override it." },
      { key: "minSecondsBetweenSubmissions", label: "Min seconds between quests", hint: "Pause between two sent quests." },
      { key: "maxSubmissionsPerDay", label: "Max quests sent per day", hint: "Per player." },
      { key: "maxDailyQuestReward", label: "Max quest earnings per day (TSh)", hint: "Per player, counted when proof is sent." },
    ],
  },
  {
    title: "Cash out safety",
    description: "Checks a player must pass before money leaves.",
    fields: [
      { key: "minAccountAgeHours", label: "Account age needed (hours)", hint: "New accounts wait before first cash out." },
      { key: "minApprovedForWithdrawal", label: "Approved quests needed", hint: "Proves the player does real work." },
      { key: "maxPendingWithdrawals", label: "Payouts waiting at once", hint: "Per player." },
    ],
  },
  {
    title: "Risk scoring",
    description: "Every cheating signal adds risk points. Good approvals slowly remove them.",
    fields: [
      { key: "holdRiskScore", label: "Hold cash outs at score", hint: "Cash out is blocked until you review the player." },
      { key: "autoBanRiskScore", label: "Suspend automatically at score", hint: "Must be higher than the hold score." },
    ],
  },
];

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState<SystemSettings | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState({ signupsOpen: true, questsOpen: true, withdrawalsOpen: true });
  const [announcement, setAnnouncement] = useState("");
  const [busy, setBusy] = useState(false);

  function hydrate(s: SystemSettings) {
    setSaved(s);
    setDraft(Object.fromEntries(groups.flatMap((g) => g.fields).map((f) => [f.key, String(s[f.key])])));
    setFlags({ signupsOpen: s.signupsOpen, questsOpen: s.questsOpen, withdrawalsOpen: s.withdrawalsOpen });
    setAnnouncement(s.announcement);
  }

  useEffect(() => {
    void adminService.settings().then((res) => {
      if (res.ok) hydrate(res.data);
      else toast.error(res.error.message);
    });
  }, []);

  const patch = useMemo(() => {
    if (!saved) return {};
    const out: Record<string, unknown> = {};
    for (const f of groups.flatMap((g) => g.fields)) {
      const value = Number(draft[f.key]);
      if (draft[f.key] !== "" && value !== saved[f.key]) out[f.key] = value;
    }
    (Object.keys(flags) as Array<keyof typeof flags>).forEach((k) => {
      if (flags[k] !== saved[k]) out[k] = flags[k];
    });
    if (announcement.trim() !== saved.announcement) out.announcement = announcement;
    return out;
  }, [saved, draft, flags, announcement]);

  const dirty = Object.keys(patch).length > 0;

  async function save() {
    setBusy(true);
    const res = await adminService.saveSettings(patch as Partial<SystemSettings>);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    hydrate(res.data);
    toast.success("Settings saved");
  }

  if (!saved) {
    return (
      <DashboardShell role="admin" title="Settings">
        <Loading />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="admin" title="Settings">
      <div className="space-y-6 pb-20">
        <Card>
          <CardHeader>
            <CardTitle>Switches</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Toggle label="New sign-ups" hint="Off blocks new accounts. Existing players keep playing." checked={flags.signupsOpen} onChange={(v) => setFlags({ ...flags, signupsOpen: v })} />
            <Toggle label="Quests" hint="Off pauses starting and sending quests." checked={flags.questsOpen} onChange={(v) => setFlags({ ...flags, questsOpen: v })} />
            <Toggle label="Cash outs" hint="Off pauses new payout requests." checked={flags.withdrawalsOpen} onChange={(v) => setFlags({ ...flags, withdrawalsOpen: v })} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcement banner</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="announce">Shown at the top of every player screen. Leave empty to hide.</Label>
            <Textarea id="announce" maxLength={240} value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="Example: Payouts are sent every day at 6pm." />
          </CardContent>
        </Card>

        {groups.map((g) => (
          <Card key={g.title}>
            <CardHeader>
              <CardTitle>{g.title}</CardTitle>
              <p className="mt-1 text-sm font-semibold text-slate-400">{g.description}</p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {g.fields.map((f) => (
                <div key={f.key}>
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    type="number"
                    inputMode="decimal"
                    step={f.step ?? "1"}
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                  />
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {f.hint} Default {defaultSettings[f.key]}.
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>App</CardTitle>
            <Badge tone="success">live</Badge>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>App name</Label>
              <Input value={siteConfig.name} readOnly />
            </div>
            <div>
              <Label>Support email</Label>
              <Input value={siteConfig.supportEmail} readOnly />
            </div>
            <p className="text-xs font-semibold text-slate-500 sm:col-span-2">
              Admins are set with the ADMIN_EMAILS variable in Vercel. Name and email come from environment settings.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-[68px] z-20 border-t-2 border-ink-700 bg-ink-900 lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-xs font-extrabold text-slate-300 sm:text-sm">{dirty ? `${Object.keys(patch).length} unsaved change${Object.keys(patch).length > 1 ? "s" : ""}` : "All changes saved"}</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="min-h-11" disabled={!dirty || busy} onClick={() => hydrate(saved)}>
              Undo
            </Button>
            <Button variant="mint" className="min-h-11" disabled={!dirty || busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
