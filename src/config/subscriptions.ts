import type { SubscriptionTier } from "@/types";

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: 20000,
    starterCredits: 50000,
    features: [
      "Player dashboard and daily quests",
      "TSh 50,000 starter credits",
      "Standard task priority",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 60000,
    starterCredits: 250000,
    highlighted: true,
    features: [
      "Everything in Basic",
      "TSh 250,000 starter credits",
      "Premium analytics",
      "Campaign priority queue",
      "Referral race boosts",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceMonthly: 150000,
    starterCredits: 800000,
    features: [
      "Everything in Pro",
      "TSh 800,000 starter credits",
      "Dedicated success manager",
      "AI insights (coming soon)",
      "Custom challenge sponsorship",
    ],
  },
];
