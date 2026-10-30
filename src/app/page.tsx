import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const steps = [
  {
    step: "01",
    title: "Create your account",
    body: "Sign up in seconds and pick earner or advertiser mode.",
  },
  {
    step: "02",
    title: "Complete tasks & campaigns",
    body: "Follow, watch, survey, or promote — proof-backed and tracked.",
  },
  {
    step: "03",
    title: "Cash out or scale",
    body: "Withdraw earnings or fund campaigns with starter credits.",
  },
];

const features = [
  {
    title: "Proof-backed tasks",
    body: "Screenshot and auto-tracked completions keep payouts fair.",
  },
  {
    title: "Referral races",
    body: "Climb live leaderboards and share reward pools with your network.",
  },
  {
    title: "Advertiser console",
    body: "Launch follow, install, and survey campaigns with credit budgets.",
  },
  {
    title: "Marketplace gigs",
    body: "Buy design, typing, video, and coding services from verified sellers.",
  },
];

const roles = [
  {
    title: "Earners",
    body: "Stack daily tasks, streaks, and referral boosts into real wallet balance.",
    href: "/register",
    cta: "Start earning",
  },
  {
    title: "Advertisers",
    body: "Buy attention with credits — prioritize campaigns and track completions.",
    href: "/register",
    cta: "Grow your brand",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen mesh-bg text-slate-100">
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 grid-overlay opacity-60" />
          <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 animate-float rounded-full bg-teal-400/20 blur-3xl" />
          <div
            className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 animate-float rounded-full bg-cyan-400/15 blur-3xl"
            style={{ animationDelay: "1.5s" }}
          />

          <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col justify-center px-4 py-16 md:py-24">
            <div className="animate-rise max-w-3xl">
              <Brand size="lg" className="mb-8 pointer-events-none" href="/" />
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
                Turn everyday attention into digital income.
              </h1>
              <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
                {siteConfig.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get started free
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    Browse marketplace
                  </Button>
                </Link>
                <Link
                  href="/login"
                  className="text-center text-sm text-slate-400 transition hover:text-teal-200 sm:ml-2 sm:text-left"
                >
                  Already earning? Log in
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="border-t border-white/5 bg-[#070d18]/40"
        >
          <div className="mx-auto max-w-6xl px-4 py-20">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-300/80">
              How it works
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-white md:text-4xl">
              Three steps from signup to payout.
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {steps.map((item, index) => (
                <div
                  key={item.step}
                  className="animate-rise"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-cyan-300">
                    {item.step}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-white/5">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-300/80">
              Features
            </p>
            <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-semibold text-white md:text-4xl">
              Built for earners and brands in one flow.
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {features.map((feature) => (
                <div key={feature.title} className="border-l border-teal-400/30 pl-5">
                  <h3 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="border-t border-white/5 bg-[#070d18]/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-300/80">
              Roles
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-white md:text-4xl">
              Choose how you show up.
            </h2>
            <div className="mt-12 grid gap-10 md:grid-cols-2">
              {roles.map((role) => (
                <div key={role.title}>
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-white">
                    {role.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
                    {role.body}
                  </p>
                  <Link href={role.href} className="mt-5 inline-block">
                    <Button variant="outline">{role.cta}</Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/5">
          <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20">
            <div className="pointer-events-none absolute inset-x-4 inset-y-8 animate-float rounded-[2rem] bg-gradient-to-r from-teal-400/10 to-cyan-500/10 blur-2xl" />
            <div className="relative text-center">
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-white md:text-4xl">
                Ready to tap into {siteConfig.name}?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-slate-400">
                Join earners and advertisers already running tasks, races, and
                campaigns on a modern dark SaaS stack.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg">Create account</Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="secondary">
                    View pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <Brand size="sm" />
          <div className="flex flex-wrap gap-4">
            <Link href="/pricing" className="hover:text-slate-300">
              Pricing
            </Link>
            <Link href="/marketplace" className="hover:text-slate-300">
              Marketplace
            </Link>
            <Link href="/challenges" className="hover:text-slate-300">
              Challenges
            </Link>
            <Link href="/leaderboards" className="hover:text-slate-300">
              Leaderboards
            </Link>
            <Link href="/login" className="hover:text-slate-300">
              Log in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
