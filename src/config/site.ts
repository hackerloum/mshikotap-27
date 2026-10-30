export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "MshikoTap",
  description:
    "Complete tasks, join referral races, and grow earnings with a modern digital income platform.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supportEmail: "support@mshikotap.com",
  minWithdrawal: 5,
  withdrawalFeePercent: 2.5,
  currency: "USD",
  demoMode:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
} as const;

export const roleHome: Record<"user" | "advertiser" | "admin", string> = {
  user: "/user",
  advertiser: "/advertiser",
  admin: "/admin",
};
