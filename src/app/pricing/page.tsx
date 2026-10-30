import Link from "next/link";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { subscriptionTiers } from "@/config/subscriptions";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Pricing",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen mesh-bg">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mx-auto max-w-2xl text-center animate-rise">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-300/80">
            Pricing
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-white md:text-5xl">
            Plans that fund growth.
          </h1>
          <p className="mt-4 text-slate-400">
            Starter credits unlock campaigns the moment you subscribe. Upgrade
            anytime as volume scales.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {subscriptionTiers.map((tier) => (
            <Card
              key={tier.id}
              className={
                tier.highlighted
                  ? "relative border-teal-400/40 bg-teal-400/[0.06] shadow-[0_0_40px_rgba(45,212,191,0.12)]"
                  : undefined
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="font-[family-name:var(--font-display)] text-xl">
                    {tier.name}
                  </CardTitle>
                  {tier.highlighted ? (
                    <Badge tone="brand">Most popular</Badge>
                  ) : null}
                </div>
                <CardDescription>
                  {tier.starterCredits} starter campaign credits
                </CardDescription>
                <p className="pt-4 font-[family-name:var(--font-display)] text-4xl font-semibold text-white">
                  {formatCurrency(tier.priceMonthly)}
                  <span className="text-base font-normal text-slate-400">
                    /mo
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm text-slate-300">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6 block">
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? "default" : "secondary"}
                  >
                    Choose {tier.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
