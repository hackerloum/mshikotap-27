import type { SubscriptionTier } from "@/types";

export const subscriptionTiers: SubscriptionTier[] = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: 9,
    starterCredits: 50,
    features: [
      "Player dashboard and daily quests",
      "50 starter campaign credits",
      "Standard task priority",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    starterCredits: 250,
    highlighted: true,
    features: [
      "Everything in Basic",
      "250 starter credits",
      "Premium analytics",
      "Campaign priority queue",
      "Referral race boosts",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    priceMonthly: 79,
    starterCredits: 800,
    features: [
      "Everything in Pro",
      "800 starter credits",
      "Dedicated success manager",
      "AI insights (coming soon)",
      "Custom challenge sponsorship",
    ],
  },
];
