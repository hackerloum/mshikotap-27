"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { roleHome } from "@/config/site";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types";

type RegisterRole = Extract<UserRole, "user" | "advertiser">;

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [role, setRole] = useState<RegisterRole>("user");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    const ok = await register({
      displayName: displayName.trim(),
      email: email.trim(),
      password,
      role,
      referralCode: referralCode.trim() || undefined,
    });
    if (!ok) {
      toast.error(useAuthStore.getState().error || "Registration failed");
      return;
    }
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error("Session missing after registration");
      return;
    }
    toast.success(`Welcome to MshikoTap, ${user.displayName}`);
    router.push(roleHome[user.role]);
  }

  return (
    <div className="flex min-h-screen items-center justify-center mesh-bg px-4 py-12">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-[family-name:var(--font-display)] text-2xl">
              Create account
            </CardTitle>
            <CardDescription>
              Join as an earner or advertiser. Referral codes are optional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex Mwangi"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <Label htmlFor="referral">Referral code (optional)</Label>
                <Input
                  id="referral"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  placeholder="MTALEX9K2Q"
                />
              </div>
              <div>
                <Label htmlFor="role">I want to</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as RegisterRole)}
                  className="flex h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none transition focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/20"
                >
                  <option value="user" className="bg-[#0b1524]">
                    Earn with tasks
                  </option>
                  <option value="advertiser" className="bg-[#0b1524]">
                    Advertise campaigns
                  </option>
                </select>
              </div>
              {error ? (
                <p className="text-sm text-rose-300" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating…" : "Create account"}
              </Button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-teal-300 hover:text-teal-200"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
