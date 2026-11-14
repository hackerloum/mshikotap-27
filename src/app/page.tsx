import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Gift,
  Keyboard,
  PlayCircle,
  Share2,
  Swords,
  ThumbsUp,
  Wallet,
} from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Coin, Flame } from "@/components/ui/coin";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const steps = [
  {
    n: "1",
    title: "Sign in with Google",
    body: "One tap, no forms, no passwords. Your account is ready in seconds.",
    color: "bg-coin/10 text-coin",
  },
  {
    n: "2",
    title: "Complete quests",
    body: "Follow, watch, answer, share. Every quest pays coins and XP.",
    color: "bg-mint/10 text-mint",
  },
  {
    n: "3",
    title: "Cash out",
    body: "Send your coins to mobile money or your bank once you hit the minimum.",
    color: "bg-sky/10 text-sky",
  },
];

const quests = [
  { icon: ThumbsUp, title: "Social quests", body: "Follow, like and comment for brands you actually know.", tone: "bg-coral/10 text-coral" },
  { icon: PlayCircle, title: "Watch & earn", body: "Short videos. Finish them, get paid.", tone: "bg-sky/10 text-sky" },
  { icon: Brain, title: "Surveys & quizzes", body: "Share your opinion or test your knowledge.", tone: "bg-mint/10 text-mint" },
  { icon: Keyboard, title: "Typing sprints", body: "Faster typists earn more. Beat the clock.", tone: "bg-flame/10 text-flame" },
  { icon: Gift, title: "Daily bonus", body: "Show up every day. The streak multiplies your reward.", tone: "bg-coin/10 text-coin" },
  { icon: Share2, title: "Referrals", body: "Invite friends and earn when they play.", tone: "bg-coral/10 text-coral" },
];

const previewQuests = [
  { t: "Follow a brand on Instagram", r: "TSh 500", icon: ThumbsUp, tone: "bg-coral/10 text-coral" },
  { t: "Watch a short video", r: "TSh 300", icon: PlayCircle, tone: "bg-sky/10 text-sky" },
  { t: "2 min opinion survey", r: "TSh 1,000", icon: Brain, tone: "bg-mint/10 text-mint" },
];

const week = ["M", "T", "W", "T", "F", "S", "S"];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <MarketingHeader />

      <main>
        <section className="grid-bg relative overflow-hidden border-b border-ink-700/80">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-ink-700/80 bg-ink-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-coin">
                <Flame size={14} /> New quests every day
              </p>
              <h1 className="font-display text-4xl leading-[1.08] text-white sm:text-5xl">
                Complete quests.
                <br />
                Level up.
                <br />
                <span className="text-coin">Get paid.</span>
              </h1>
              <p className="mt-5 max-w-md text-lg text-slate-300">
                MshikoTap turns small online tasks into a rewards program. Complete quests, keep your streak alive, compete in races and cash out real money.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                  Get started free
                </Link>
                <Link
                  href="/#how"
                  className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "w-full sm:w-auto")}
                >
                  How it works
                </Link>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Sign in with Google. Takes about five seconds.
              </p>
            </div>

            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-xl border border-ink-700/80 bg-ink-900 p-4 shadow-sm shadow-black/20">
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-sky/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-sky">
                    Level 7
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
                    <Flame size={18} /> <span className="tabular">6</span> day streak
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={68} tone="sky" label="XP progress" />
                  <p className="tabular mt-1 text-right text-xs font-medium text-slate-400">680 / 1,000 XP</p>
                </div>
                <div className="mt-3 space-y-2">
                  {previewQuests.map((q) => {
                    const Icon = q.icon;
                    return (
                      <div
                        key={q.t}
                        className="flex items-center gap-3 rounded-lg border border-ink-700/80 bg-ink-800 p-3"
                      >
                        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", q.tone)}>
                          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{q.t}</span>
                        <span className="tabular rounded-md bg-coin/10 px-2 py-1 text-xs font-semibold text-coin">
                          {q.r}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-lg bg-mint py-2.5 text-center text-sm font-semibold text-ink-950">
                  Claim daily bonus
                </div>
                <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Example screen
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 md:py-20">
          <h2 className="font-display text-2xl text-white md:text-3xl">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-ink-700/80 bg-ink-900 p-6 shadow-sm shadow-black/20"
              >
                <span
                  className={cn(
                    "tabular grid h-10 w-10 place-items-center rounded-lg font-display text-lg",
                    s.color,
                  )}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-xl text-white">{s.title}</h3>
                <p className="mt-1 text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-ink-700/80 bg-ink-900">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <h2 className="font-display text-2xl text-white md:text-3xl">Choose your kind of quest</h2>
            <p className="mt-2 max-w-xl text-slate-400">
              Quick tasks when you have a minute, longer ones when you want a bigger payout.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quests.map((q) => {
                const Icon = q.icon;
                return (
                  <div
                    key={q.title}
                    className="flex gap-4 rounded-xl border border-ink-700/80 bg-ink-800 p-5"
                  >
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
                        q.tone,
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-display text-lg text-white">{q.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-400">{q.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl text-white md:text-3xl">
              Keep the streak. <span className="text-flame">Boost the pay.</span>
            </h2>
            <p className="mt-3 max-w-md text-slate-400">
              Log in every day and your daily reward grows for seven days straight. Miss a day and the streak resets.
            </p>
            <Link href="/register" className={cn(buttonVariants({ variant: "mint", size: "lg" }), "mt-6")}>
              Start my streak
            </Link>
          </div>
          <div className="rounded-xl border border-ink-700/80 bg-ink-900 p-5 shadow-sm shadow-black/20">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {week.map((d, i) => (
                <div key={i} className="text-center">
                  <div
                    className={cn(
                      "mx-auto grid aspect-square w-full max-w-14 place-items-center rounded-lg border",
                      i < 5 ? "border-flame/40 bg-flame/10" : "border-ink-700/80 bg-ink-800",
                    )}
                  >
                    {i < 5 ? <Flame size={22} /> : <span className="h-1.5 w-1.5 rounded-full bg-ink-600" />}
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-lg border border-ink-700/80 bg-ink-800 px-4 py-3">
              <span className="text-sm font-semibold text-slate-300">Day 5 reward</span>
              <span className="tabular flex items-center gap-1.5 font-display text-lg text-coin">
                <Coin size={20} /> +TSh 350
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 md:grid-cols-2 md:pb-20">
          <Link
            href="/challenges"
            className="group rounded-xl border border-ink-700/80 bg-ink-900 p-6 shadow-sm shadow-black/20 transition-colors hover:border-ink-600"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-sky/10 text-sky">
              <Swords className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 flex items-center gap-2 font-display text-xl text-white">
              Jump into a race
              <ArrowRight
                className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-sky"
                aria-hidden="true"
              />
            </h3>
            <p className="mt-1 text-slate-400">
              Weekly referral races and flash sprints with prize pools. Top the board, take the pot.
            </p>
          </Link>
          <Link
            href="/pricing"
            className="group rounded-xl border border-ink-700/80 bg-ink-900 p-6 shadow-sm shadow-black/20 transition-colors hover:border-ink-600"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-coin/10 text-coin">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 flex items-center gap-2 font-display text-xl text-white">
              Upgrade your plan
              <ArrowRight
                className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-coin"
                aria-hidden="true"
              />
            </h3>
            <p className="mt-1 text-slate-400">
              Optional plans give you more quests per day, bigger XP and faster payouts.
            </p>
          </Link>
        </section>

        <section className="border-t border-ink-700/80 bg-ink-900">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <h2 className="font-display text-3xl text-white md:text-4xl">Ready to start earning?</h2>
            <p className="mx-auto mt-3 max-w-md text-slate-400">
              Your first quest board is waiting. Sign in with Google and get started.
            </p>
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
              Get started
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
