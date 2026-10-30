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

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    const ok = await login(email.trim(), password);
    if (!ok) {
      toast.error(useAuthStore.getState().error || "Login failed");
      return;
    }
    const user = useAuthStore.getState().user;
    if (!user) {
      toast.error("Session missing after login");
      return;
    }
    toast.success(`Welcome back, ${user.displayName}`);
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
              Log in
            </CardTitle>
            <CardDescription>
              Demo hint: any email works. Use{" "}
              <span className="text-teal-300">admin@</span>,{" "}
              <span className="text-teal-300">advertiser@</span>, or{" "}
              <span className="text-teal-300">brand@</span> to map roles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error ? (
                <p className="text-sm text-rose-300" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <div className="mt-5 flex flex-col gap-2 text-center text-sm text-slate-400">
              <Link
                href="/forgot-password"
                className="text-teal-300 hover:text-teal-200"
              >
                Forgot password?
              </Link>
              <p>
                New here?{" "}
                <Link
                  href="/register"
                  className="text-teal-300 hover:text-teal-200"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
