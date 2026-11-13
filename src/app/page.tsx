import Link from "next/link";
import {
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
import { Coin, Flame, Star } from "@/components/ui/coin";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const steps = [
  {
    n: "1",
    title: "Tap in with Google",
    body: "One tap, no forms, no passwords. Your player is ready in seconds.",
    color: "bg-coin text-ink-950",
  },
  {
    n: "2",
    title: "Clear quests",
    body: "Follow, watch, answer, share. Every quest pays coins and XP.",
    color: "bg-mint text-ink-950",
  },
  {
    n: "3",
    title: "Cash out",
    body: "Send your coins to mobile money or your bank once you hit the minimum.",
    color: "bg-sky text-ink-950",
  },
];

const quests = [
  { icon: ThumbsUp, title: "Social quests", body: "Follow, like and comment for brands you actually know.", tone: "bg-coral" },
  { icon: PlayCircle, title: "Watch & earn", body: "Short videos. Finish them, get paid.", tone: "bg-sky" },
  { icon: Brain, title: "Surveys & quizzes", body: "Share your opinion or test your brain.", tone: "bg-mint" },
  { icon: Keyboard, title: "Typing sprints", body: "Fast fingers pay more. Beat the clock.", tone: "bg-flame" },
  { icon: Gift, title: "Daily bonus", body: "Show up every day. The streak multiplies your reward.", tone: "bg-coin" },
  { icon: Share2, title: "Squad invites", body: "Bring friends in and earn when they play.", tone: "bg-coral" },
];

const week = ["M", "T", "W", "T", "F", "S", "S"];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <MarketingHeader />

      <main>
        <section className="dots relative overflow-hidden border-b-2 border-ink-700">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-ink-600 bg-ink-800 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-coin">
                <Flame size={16} /> New quests every day
              </p>
              <h1 className="font-display text-[2.75rem] leading-[1.02] text-white sm:text-6xl lg:text-7xl">
                Tap quests.
                <br />
                Level up.
                <br />
                <span className="scribble text-coin">Get paid.</span>
              </h1>
              <p className="mt-5 max-w-md text-lg font-semibold text-slate-300">
                MshikoTap turns small online tasks into a game. Clear quests, keep your streak alive, race your friends and cash out real money.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                  Start playing, it&apos;s free
                </Link>
                <Link
                  href="/#how"
                  className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "w-full sm:w-auto")}
                >
                  How it works
                </Link>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Sign in with Google. Takes about five seconds.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <Coin size={64} className="absolute -left-4 -top-6 z-10 animate-bob [--tilt:-10deg]" />
              <Star size={48} className="absolute -right-3 top-24 z-10 animate-bob [--tilt:12deg] [animation-delay:1s]" />
              <div className="rotate-2 rounded-[2rem] border-2 border-ink-600 bg-ink-900 p-4 shadow-[0_10px_0_0_var(--color-ink-700)]">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-sky px-2 py-0.5 font-display text-sm text-ink-950">LV 7</span>
                  <span className="flex items-center gap-1 font-display text-white">
                    <Flame size={20} /> 6 day streak
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={68} tone="sky" label="XP progress" />
                  <p className="mt-1 text-right text-xs font-bold text-slate-400">680 / 1000 XP</p>
                </div>
                <div className="mt-3 space-y-2.5">
                  {[
                    { t: "Follow @urbanwear", r: "$0.40", c: "bg-coral" },
                    { t: "Watch: Kilimanjaro vlog", r: "$0.25", c: "bg-sky" },
                    { t: "2 min opinion survey", r: "$0.90", c: "bg-mint" },
                  ].map((q) => (
                    <div
                      key={q.t}
                      className="flex items-center gap-3 rounded-2xl border-2 border-ink-700 bg-ink-800 p-3"
                    >
                      <span className={cn("h-10 w-10 shrink-0 rounded-xl border-2 border-ink-950", q.c)} />
                      <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-white">{q.t}</span>
                      <span className="flex items-center gap-1 rounded-full bg-coin px-2.5 py-1 font-display text-sm text-ink-950">
                        {q.r}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 rounded-2xl bg-mint py-3 text-center font-display text-lg text-ink-950 shadow-[0_4px_0_0_var(--color-mint-deep)]">
                  Claim daily bonus
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border-b-2 border-ink-700 bg-coin py-3" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-xl text-ink-950">
            {Array.from({ length: 2 }).flatMap((_, i) =>
              ["Follow", "Watch", "Survey", "Quiz", "Type", "Refer", "Race", "Cash out"].map((w) => (
                <span key={`${i}-${w}`} className="flex items-center gap-8">
                  {w} <Star size={18} />
                </span>
              )),
            )}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 md:py-20">
          <h2 className="font-display text-4xl text-white md:text-5xl">Three steps. No catch.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-3xl border-2 border-ink-700 bg-ink-900 p-6 shadow-[0_5px_0_0_var(--color-ink-700)]"
              >
                <span
                  className={cn(
                    "grid h-14 w-14 place-items-center rounded-2xl border-2 border-ink-950 font-display text-3xl",
                    s.color,
                  )}
                >
                  {s.n}
                </span>
                <h3 className="mt-4 font-display text-2xl text-white">{s.title}</h3>
                <p className="mt-1 font-semibold text-slate-400">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y-2 border-ink-700 bg-ink-900">
          <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
            <h2 className="font-display text-4xl text-white md:text-5xl">Pick your kind of quest</h2>
            <p className="mt-2 max-w-xl font-semibold text-slate-400">
              Something for every mood. Quick taps when you have a minute, longer ones when you want a bigger payout.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quests.map((q) => {
                const Icon = q.icon;
                return (
                  <div
                    key={q.title}
                    className="flex gap-4 rounded-3xl border-2 border-ink-700 bg-ink-800 p-5 transition hover:-translate-y-1"
                  >
                    <span
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink-950 text-ink-950",
                        q.tone,
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="font-display text-xl text-white">{q.title}</h3>
                      <p className="mt-0.5 text-sm font-semibold text-slate-400">{q.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:py-20 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl text-white md:text-5xl">
              Keep the streak. <span className="text-flame">Boost the pay.</span>
            </h2>
            <p className="mt-3 max-w-md font-semibold text-slate-400">
              Log in every day and your daily reward grows for seven days straight. Miss a day and the streak resets, so don&apos;t ghost the game.
            </p>
            <Link href="/register" className={cn(buttonVariants({ variant: "mint", size: "lg" }), "mt-6")}>
              Start my streak
            </Link>
          </div>
          <div className="rounded-3xl border-2 border-ink-700 bg-ink-900 p-5 shadow-[0_5px_0_0_var(--color-ink-700)]">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {week.map((d, i) => (
                <div key={i} className="text-center">
                  <div
                    className={cn(
                      "mx-auto grid aspect-square w-full max-w-14 place-items-center rounded-2xl border-2",
                      i < 5 ? "border-flame/60 bg-flame/15" : "border-ink-700 bg-ink-800",
                    )}
                  >
                    {i < 5 ? <Flame size={26} /> : <span className="h-2 w-2 rounded-full bg-ink-600" />}
                  </div>
                  <p className="mt-1 text-xs font-extrabold text-slate-400">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink-800 px-4 py-3">
              <span className="font-bold text-slate-300">Day 5 reward</span>
              <span className="flex items-center gap-1.5 font-display text-xl text-coin">
                <Coin size={22} /> +$0.20
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 md:grid-cols-2 md:pb-20">
          <Link
            href="/challenges"
            className="group rounded-3xl border-2 border-ink-950 bg-sky p-6 text-ink-950 shadow-[0_6px_0_0_var(--color-sky-deep)] transition active:translate-y-1"
          >
            <Swords className="h-9 w-9" />
            <h3 className="mt-3 font-display text-3xl">Jump into a race</h3>
            <p className="mt-1 font-bold">
              Weekly referral races and flash sprints with prize pools. Top the board, take the pot.
            </p>
          </Link>
          <Link
            href="/pricing"
            className="group rounded-3xl border-2 border-ink-950 bg-coin p-6 text-ink-950 shadow-[0_6px_0_0_var(--color-coin-deep)] transition active:translate-y-1"
          >
            <Wallet className="h-9 w-9" />
            <h3 className="mt-3 font-display text-3xl">Grab a boost</h3>
            <p className="mt-1 font-bold">
              Optional plans give you more quests per day, bigger XP and faster payouts.
            </p>
          </Link>
        </section>

        <section className="dots border-t-2 border-ink-700 bg-ink-900">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <Coin size={64} className="mx-auto animate-bob" />
            <h2 className="mt-4 font-display text-4xl text-white md:text-6xl">Ready, player one?</h2>
            <p className="mx-auto mt-3 max-w-md font-semibold text-slate-400">
              Your first quest board is waiting. Sign in with Google and start collecting.
            </p>
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
              Play now
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
