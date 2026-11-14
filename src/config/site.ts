export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "MshikoTap",
  description:
    "Clear quick quests, keep your streak, race your friends and cash out. The game that pays, built for East Africa.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  supportEmail: "support@mshikotap.com",
  currency: "TZS",
} as const;

export const roleHome: Record<"user" | "advertiser" | "admin", string> = {
  user: "/user",
  advertiser: "/advertiser",
  admin: "/admin",
};
