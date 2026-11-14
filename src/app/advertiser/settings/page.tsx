"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { paymentsService } from "@/services/payments.service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { formatNumber } from "@/lib/utils";

export default function AdvertiserSettingsPage() {
  const user = useAuthStore((s) => s.user);

  const router = useRouter();
  const refresh = useAuthStore((s) => s.refreshProfile);

  async function switchToPlayer() {
    const res = await paymentsService.setRole("user");
    if (!res.ok) {
      toast.error(res.error.message);
      return;
    }
    await refresh();
    router.push("/user");
  }

  return (
    <DashboardShell role="advertiser" title="Settings">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              You sign in with Google, so these details come from your Google
              account.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Brand name</Label>
              <Input value={user?.displayName ?? ""} readOnly />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={user?.role ?? "advertiser"} readOnly />
            </div>
            <div>
              <Label>Credits</Label>
              <Input
                value={formatNumber(user?.advertiserCredits ?? 0)}
                readOnly
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earn as a player too</CardTitle>
            <p className="mt-1 text-sm text-slate-400">
              Switch to the player side to finish quests and cash out. Your advertiser balance and quests stay safe.
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => void switchToPlayer()}>
              Switch to player view
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
