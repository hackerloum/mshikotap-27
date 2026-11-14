"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Swords, Target, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { roleHome } from "@/config/site";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";

function GoogleG() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export function AuthScreen({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const params = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signInWithGoogle);
  const clearError = useAuthStore((s) => s.clearError);
  const [code, setCode] = useState("");

  const isRegister = mode === "register";

  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      setCode(ref.toUpperCase());
      authService.rememberReferral(ref);
    }
  }, [params]);

  useEffect(() => {
    if (hydrated && user) router.replace(roleHome[user.role]);
  }, [hydrated, user, router]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  async function onGoogle() {
    clearError();
    if (isRegister && code.trim()) authService.rememberReferral(code.trim());
    const okay = await signIn();
    if (okay) toast.success(isRegister ? "Account created. Welcome aboard." : "Welcome back.");
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <div className="relative flex items-center justify-between px-4 py-4">
        <Brand />
        <Link
          href="/"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 hover:text-white"
        >
          Back
        </Link>
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-10">
        <div className="rounded-2xl border border-ink-700/80 bg-ink-900 p-6 shadow-xl shadow-black/30 sm:p-8">
          <h1 className="text-center font-display text-3xl leading-tight text-white">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-center text-sm text-slate-400">
            {isRegister
              ? "One tap with Google and you land straight in your quest board."
              : "Pick up your streak and keep earning."}
          </p>

          <ul className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-slate-300">
            <li className="rounded-lg bg-ink-800 px-2 py-3">
              <Target className="mx-auto mb-1.5 h-5 w-5 text-coin" aria-hidden="true" />Daily quests
            </li>
            <li className="rounded-lg bg-ink-800 px-2 py-3">
              <Swords className="mx-auto mb-1.5 h-5 w-5 text-sky" aria-hidden="true" />Live races
            </li>
            <li className="rounded-lg bg-ink-800 px-2 py-3">
              <Wallet className="mx-auto mb-1.5 h-5 w-5 text-mint" aria-hidden="true" />Fast payouts
            </li>
          </ul>

          {isRegister ? (
            <div className="mt-5">
              <label
                htmlFor="invite"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Invite code <span className="text-slate-500">(optional)</span>
              </label>
              <input
                id="invite"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={12}
                placeholder="e.g. MTA1B2C3"
                autoComplete="off"
                className="h-11 w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 font-mono text-base tracking-widest text-white outline-none placeholder:font-sans placeholder:text-sm placeholder:tracking-normal placeholder:text-slate-500 focus:border-coin focus:ring-2 focus:ring-coin/25"
              />
            </div>
          ) : null}

          <Button
            variant="white"
            size="lg"
            className="mt-6 w-full"
            onClick={onGoogle}
            disabled={loading}
          >
            <GoogleG />
            {loading ? "Opening Google…" : "Continue with Google"}
          </Button>

          <p className="mt-5 text-center text-sm text-slate-400">
            {isRegister ? "Already have an account?" : "New here?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-coin hover:underline"
            >
              {isRegister ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
          We only use Google to confirm who you are. No passwords to remember.
        </p>
      </div>
    </div>
  );
}
