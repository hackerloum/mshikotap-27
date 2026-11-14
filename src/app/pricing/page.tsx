import Link from "next/link";
import { Check, Rocket, Sparkles, Zap, Crown } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { subscriptionTiers } from "@/config/subscriptions";
import { cn, formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan, SubscriptionTier } from "@/types";

export const metadata = {
  title: "Plans",
};

const freeTier: SubscriptionTier = {
  id: "free",
  name: "Free",
  priceMonthly: 0,
  starterCredits: 0,
  features: [],
};

const perks: Record<SubscriptionPlan, string[]> = {
  free: [
    "Daily quests and daily claim",
    "Join public races",
    "Appear on the leaderboard",
    "Withdraw once you hit the minimum",
  ],
  basic: [
    "Everything in Free",
    "Small XP and coin boost",
    "Standard quest priority",
    "Email support",
  ],
  pro: [
    "Everything in Basic",
    "Bigger XP and coin boost",
    "Early access to new quests",
    "Race entry boosts",
    "Streak shield",
  ],
  premium: [
    "Everything in Pro",
    "Max XP and coin boost",
    "First pick on high-pay quests",
    "Priority withdrawals",
    "Premium support",
  ],
};

const look: Record<
  SubscriptionPlan,
  {
    icon: typeof Zap;
    iconBg: string;
    check: string;
    cta: "secondary" | "sky" | "default" | "mint";
    tag: string;
  }
> = {
  free: {
    icon: Rocket,
    iconBg: "bg-ink-700 text-slate-200",
    check: "text-slate-300",
    cta: "secondary",
    tag: "Start here",
  },
  basic: {
    icon: Zap,
    iconBg: "bg-sky/10 text-sky",
    check: "text-sky",
    cta: "sky",
    tag: "Entry",
  },
  pro: {
    icon: Sparkles,
    iconBg: "bg-coin/10 text-coin",
    check: "text-coin",
    cta: "default",
    tag: "Most popular",
  },
  premium: {
    icon: Crown,
    iconBg: "bg-mint/10 text-mint",
    check: "text-mint",
    cta: "mint",
    tag: "Top tier",
  },
};

const faqs = [
  {
    q: "Do I need a paid plan to play?",
    a: "No. Free players earn every day. Paid plans make each quest pay more.",
  },
  {
    q: "How do I sign up?",
    a: "Choose any plan and sign in with Google. That is the whole signup.",
  },
  {
    q: "Can I switch plans?",
    a: "Yes. Move up or down whenever you like.",
  },
];

export default function PricingPage() {
  const tiers = subscriptionTiers.some((t) => t.id === "free")
    ? subscriptionTiers
    : [freeTier, ...subscriptionTiers];

  return (
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <MarketingHeader />
      <main>
        <section className="grid-bg border-b border-ink-700/80">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 text-center sm:pb-14 sm:pt-16">
            <span className="inline-flex items-center rounded-md border border-ink-700/80 bg-ink-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-coin">
              Plans
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-[1.1] text-white sm:text-5xl">
              Pick your <span className="text-coin">plan</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
              Play free, always. Upgrade when you want every quest to pay more
              XP and coins.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8 pt-12">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const v = look[tier.id];
              const Icon = v.icon;
              const popular = !!tier.highlighted;
              const list = perks[tier.id] ?? tier.features;
              return (
                <div
                  key={tier.id}
                  className={cn(
                    "relative flex flex-col rounded-xl border bg-ink-900 p-5 shadow-sm shadow-black/20",
                    popular ? "border-coin/60 bg-ink-800" : "border-ink-700/80",
                  )}
                >
                  {popular ? (
                    <div className="absolute -top-3 left-5 whitespace-nowrap rounded-md bg-coin px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-950">
                      Best value
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
                        v.iconBg,
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-xl leading-none text-white">
                        {tier.name}
                      </h2>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {v.tag}
                      </p>
                    </div>
                  </div>

                  <p className="tabular mt-5 font-display text-4xl leading-none text-white">
                    {tier.priceMonthly === 0
                      ? "Free"
                      : formatCurrency(tier.priceMonthly)}
                    {tier.priceMonthly > 0 ? (
                      <span className="ml-1 font-sans text-sm font-semibold text-slate-400">
                        /mo
                      </span>
                    ) : null}
                  </p>

                  <ul className="mt-5 flex-1 space-y-3 text-sm text-slate-200">
                    {list.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className={cn("mt-0.5 h-4 w-4 shrink-0", v.check)}
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({
                        variant: v.cta,
                        size: "lg",
                      }),
                      "mt-6 w-full",
                    )}
                  >
                    {tier.priceMonthly === 0 ? "Start free" : `Get ${tier.name}`}
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="mt-10 text-center text-sm text-slate-400">
            Sign in with Google to start. No card needed for Free.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-2xl text-white">Frequently asked questions</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-xl border border-ink-700/80 bg-ink-900 p-5 shadow-sm shadow-black/20"
              >
                <h3 className="font-display text-base text-white">{f.q}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
