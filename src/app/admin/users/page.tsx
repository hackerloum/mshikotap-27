"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { demoAdmin, demoAdvertiser, demoUser } from "@/data/demo";
import type { UserProfile } from "@/types";
import { toast } from "sonner";

type Row = Pick<
  UserProfile,
  "uid" | "displayName" | "email" | "role" | "subscription" | "isBanned"
>;

const seed: Row[] = [
  {
    uid: demoUser.uid,
    displayName: demoUser.displayName,
    email: demoUser.email,
    role: demoUser.role,
    subscription: demoUser.subscription,
    isBanned: demoUser.isBanned,
  },
  {
    uid: demoAdvertiser.uid,
    displayName: demoAdvertiser.displayName,
    email: demoAdvertiser.email,
    role: demoAdvertiser.role,
    subscription: demoAdvertiser.subscription,
    isBanned: demoAdvertiser.isBanned,
  },
  {
    uid: demoAdmin.uid,
    displayName: demoAdmin.displayName,
    email: demoAdmin.email,
    role: demoAdmin.role,
    subscription: demoAdmin.subscription,
    isBanned: demoAdmin.isBanned,
  },
  {
    uid: "demo-user-002",
    displayName: "Sara Kimani",
    email: "sara@example.com",
    role: "user",
    subscription: "basic",
    isBanned: false,
  },
  {
    uid: "demo-user-003",
    displayName: "Omar Said",
    email: "omar@example.com",
    role: "user",
    subscription: "free",
    isBanned: true,
  },
];

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>(seed);
  const [query, setQuery] = useState("");

  const filtered = rows.filter(
    (r) =>
      r.displayName.toLowerCase().includes(query.toLowerCase()) ||
      r.email.toLowerCase().includes(query.toLowerCase()),
  );

  function toggleBan(uid: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.uid === uid ? { ...r, isBanned: !r.isBanned } : r,
      ),
    );
    const row = rows.find((r) => r.uid === uid);
    toast.success(
      row?.isBanned ? `Unbanned ${row.displayName}` : `Banned ${row?.displayName}`,
    );
  }

  return (
    <DashboardShell role="admin" title="Players">
      <div className="space-y-6">
        <Input
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <Card>
          <CardHeader>
            <CardTitle>Directory</CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">
                Nobody matches that search.
              </p>
            ) : null}

            <div className="space-y-3 md:hidden">
              {filtered.map((r) => (
                <div
                  key={r.uid}
                  className="space-y-3 rounded-2xl border-2 border-ink-700 bg-ink-800 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg text-white">
                      {r.displayName}
                    </p>
                    <p className="truncate text-xs text-slate-400">{r.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{r.role}</Badge>
                    <Badge tone="info">{r.subscription}</Badge>
                    <Badge tone={r.isBanned ? "danger" : "success"}>
                      {r.isBanned ? "banned" : "active"}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    className="min-h-11 w-full"
                    variant={r.isBanned ? "mint" : "danger"}
                    onClick={() => toggleBan(r.uid)}
                    disabled={r.role === "admin"}
                  >
                    {r.isBanned ? "Unban" : "Ban"}
                  </Button>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-400">
                  <tr className="border-b-2 border-ink-700">
                    <th className="pb-3 font-extrabold">Player</th>
                    <th className="pb-3 font-extrabold">Role</th>
                    <th className="pb-3 font-extrabold">Plan</th>
                    <th className="pb-3 font-extrabold">Status</th>
                    <th className="pb-3 font-extrabold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-ink-800">
                  {filtered.map((r) => (
                    <tr key={r.uid}>
                      <td className="py-3">
                        <p className="font-bold text-white">{r.displayName}</p>
                        <p className="text-xs text-slate-400">{r.email}</p>
                      </td>
                      <td className="py-3">
                        <Badge>{r.role}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge tone="info">{r.subscription}</Badge>
                      </td>
                      <td className="py-3">
                        <Badge tone={r.isBanned ? "danger" : "success"}>
                          {r.isBanned ? "banned" : "active"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant={r.isBanned ? "mint" : "danger"}
                          onClick={() => toggleBan(r.uid)}
                          disabled={r.role === "admin"}
                        >
                          {r.isBanned ? "Unban" : "Ban"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
