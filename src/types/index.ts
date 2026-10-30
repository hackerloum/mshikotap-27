export type UserRole = "user" | "advertiser" | "admin";

export type SubscriptionPlan = "free" | "basic" | "pro" | "premium";

export type TaskCategory =
  | "social"
  | "youtube"
  | "survey"
  | "video"
  | "app_install"
  | "referral"
  | "daily"
  | "quiz"
  | "typing"
  | "screenshot";

export type TaskType =
  | "follow"
  | "like"
  | "comment"
  | "subscribe"
  | "survey"
  | "watch"
  | "install"
  | "referral"
  | "daily_login"
  | "quiz"
  | "typing"
  | "screenshot_proof";

export type TaskStatus = "open" | "in_progress" | "submitted" | "approved" | "rejected" | "expired";

export type WithdrawalMethod = "mobile_money" | "bank_transfer" | "paypal" | "crypto";

export type WithdrawalStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "processing"
  | "completed"
  | "rejected"
  | "cancelled";

export type CampaignType =
  | "instagram_follow"
  | "tiktok_follow"
  | "youtube_subscribe"
  | "website_visit"
  | "app_install"
  | "survey"
  | "comment_engagement";

export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "rejected";

export type MarketplaceCategory =
  | "graphic_design"
  | "typing"
  | "video_editing"
  | "social_promotion"
  | "writing"
  | "coding";

export type ChallengeType = "referral_race" | "weekly" | "flash" | "milestone";

export type NotificationChannel = "push" | "in_app" | "email" | "sms" | "whatsapp";

export interface Wallet {
  balance: number;
  pendingBalance: number;
  lifetimeEarnings: number;
  currency: string;
  updatedAt: string;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  streakDays: number;
  longestStreak: number;
  badges: string[];
  lastDailyClaimAt?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  referralCode: string;
  referredBy?: string;
  subscription: SubscriptionPlan;
  wallet: Wallet;
  gamification: GamificationProfile;
  advertiserCredits?: number;
  isBanned: boolean;
  deviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  instructions: string;
  category: TaskCategory;
  type: TaskType;
  reward: number;
  xpReward: number;
  status: TaskStatus;
  requiresScreenshot: boolean;
  timeLimitMinutes?: number;
  maxCompletions?: number;
  completions: number;
  advertiserId?: string;
  campaignId?: string;
  targetUrl?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  status: Extract<TaskStatus, "submitted" | "approved" | "rejected">;
  proofUrl?: string;
  notes?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  ipAddress?: string;
  deviceId?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: WithdrawalMethod;
  destination: string;
  status: WithdrawalStatus;
  createdAt: string;
  processedAt?: string;
  notes?: string;
}

export interface ReferralStats {
  code: string;
  totalReferrals: number;
  activeReferrals: number;
  earnings: number;
  rank: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  rewardPool: number;
  startsAt: string;
  endsAt: string;
  participants: number;
  status: "upcoming" | "live" | "ended";
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  score: number;
  avatarUrl?: string;
}

export interface Campaign {
  id: string;
  advertiserId: string;
  title: string;
  type: CampaignType;
  status: CampaignStatus;
  budgetCredits: number;
  spentCredits: number;
  costPerAction: number;
  targetUrl?: string;
  instructions: string;
  completions: number;
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: MarketplaceCategory;
  price: number;
  rating: number;
  orders: number;
  deliveryDays: number;
  tags: string[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  channel: NotificationChannel;
  read: boolean;
  href?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface SubscriptionTier {
  id: SubscriptionPlan;
  name: string;
  priceMonthly: number;
  starterCredits: number;
  features: string[];
  highlighted?: boolean;
}

export interface EarningsPoint {
  date: string;
  amount: number;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorShape;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
