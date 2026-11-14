export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "MshikoTap",
  description:
    "Complete verified quests, build your streak, compete on the leaderboard and cash out to mobile money. Built for East Africa.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supportEmail: "support@mshikotap.com",
  currency: "TZS",
} as const;

export const roleHome: Record<"user" | "advertiser" | "admin", string> = {
  user: "/user",
  advertiser: "/advertiser",
  admin: "/admin",
};
