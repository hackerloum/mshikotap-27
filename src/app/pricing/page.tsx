import Link from "next/link";
import { Check, Rocket, Sparkles, Zap, Crown } from "lucide-react";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { Coin } from "@/components/ui/coin";
import { subscriptionTiers } from "@/config/subscriptions";
import { cn, formatCurrency } from "@/lib/utils";
import type { SubscriptionPlan, SubscriptionTier } from "@/types";

export const metadata = {
  title: "Boosts",
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
    "Climb the leaderboard",
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
    shadow: string;
    border: string;
    check: string;
    cta: "secondary" | "sky" | "default" | "mint";
    tag: string;
  }
> = {
  free: {
    icon: Rocket,
    iconBg: "bg-ink-700 text-slate-200",
    shadow: "shadow-[0_6px_0_0_var(--color-ink-700)]",
    border: "border-ink-700",
    check: "text-slate-300",
    cta: "secondary",
    tag: "Start here",
  },
  basic: {
    icon: Zap,
    iconBg: "bg-sky/20 text-sky",
    shadow: "shadow-[0_6px_0_0_var(--color-sky-deep)]",
    border: "border-sky",
    check: "text-sky",
    cta: "sky",
    tag: "Warm up",
  },
  pro: {
    icon: Sparkles,
    iconBg: "bg-coin text-ink-950",
    shadow: "shadow-[0_6px_0_0_var(--color-coin-deep)]",
    border: "border-coin",
    check: "text-coin",
    cta: "default",
    tag: "Full speed",
  },
  premium: {
    icon: Crown,
    iconBg: "bg-mint/20 text-mint",
    shadow: "shadow-[0_6px_0_0_var(--color-mint-deep)]",
    border: "border-mint",
    check: "text-mint",
    cta: "mint",
    tag: "Top tier",
  },
};

const faqs = [
  {
    q: "Do I need a boost to play?",
    a: "Nope. Free players earn every day. Boosts just make each quest pay more.",
  },
  {
    q: "How do I sign up?",
    a: "Tap any plan and sign in with Google. That is the whole signup.",
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
        <section className="dots border-b-2 border-ink-800">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 text-center sm:pb-14 sm:pt-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-ink-800 px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-coin">
              <Coin size={16} /> Boost plans
            </span>
            <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-[1.05] text-white sm:text-6xl">
              Pick your <span className="scribble text-coin">boost</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base font-semibold text-slate-300 sm:text-lg">
              Play free forever. Boost when you want every quest to pay more
              XP and coins.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8 pt-14">
          <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const v = look[tier.id];
              const Icon = v.icon;
              const popular = !!tier.highlighted;
              const list = perks[tier.id] ?? tier.features;
              return (
                <div
                  key={tier.id}
                  className={cn(
                    "relative flex flex-col rounded-3xl border-2 bg-ink-900 p-5 pt-6",
                    v.border,
                    v.shadow,
                    popular && "bg-ink-800 lg:-translate-y-3",
                  )}
                >
                  {popular ? (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 -rotate-2 whitespace-nowrap rounded-full border-2 border-ink-950 bg-coin px-4 py-1 font-display text-sm text-ink-950 shadow-[0_3px_0_0_var(--color-coin-deep)]">
                      Best value
                    </div>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl",
                        v.iconBg,
                      )}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl leading-none text-white">
                        {tier.name}
                      </h2>
                      <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        {v.tag}
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 font-display text-5xl leading-none text-white">
                    {tier.priceMonthly === 0
                      ? "Free"
                      : formatCurrency(tier.priceMonthly)}
                    {tier.priceMonthly > 0 ? (
                      <span className="ml-1 font-sans text-sm font-extrabold text-slate-400">
                        /mo
                      </span>
                    ) : null}
                  </p>

                  <ul className="mt-5 flex-1 space-y-3 text-sm font-semibold text-slate-200">
                    {list.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check
                          className={cn("mt-0.5 h-4 w-4 shrink-0", v.check)}
                          strokeWidth={3.5}
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
                    {tier.priceMonthly === 0 ? "Play free" : `Get ${tier.name}`}
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="mt-10 text-center text-sm font-semibold text-slate-400">
            Sign in with Google to start. No card needed for Free.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-display text-3xl text-white">Quick answers</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-3xl border-2 border-ink-700 bg-ink-900 p-5 shadow-[0_5px_0_0_var(--color-ink-700)]"
              >
                <h3 className="font-display text-lg text-coin">{f.q}</h3>
                <p className="mt-1.5 text-sm font-semibold text-slate-300">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
