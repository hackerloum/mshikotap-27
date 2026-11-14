import { api } from "@/lib/api-client";
import type { QuestPayload } from "@/services/campaigns.service";
import type { FlagKind, RiskLevel, SystemSettings } from "@/config/system";
import type {
  ApiResult,
  Campaign,
  CampaignStatus,
  EarningsPoint,
  PaymentRecord,
  SubscriptionPlan,
  Task,
  TaskSubmission,
  UserProfile,
  UserRole,
  Withdrawal,
  WithdrawalStatus,
} from "@/types";

export interface AdminUser {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  subscription: SubscriptionPlan;
  isBanned: boolean;
  balance: number;
  pendingBalance: number;
  level: number;
  advertiserCredits: number;
  createdAt: string;
  riskScore: number;
  risk: RiskLevel;
  trusted: boolean;
  approved: number;
}

export interface PlayerContext {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  accountAgeHours: number;
  isBanned: boolean;
  riskScore: number;
  risk: RiskLevel;
  trusted: boolean;
  approved: number;
  rejected: number;
  submitted: number;
}

export type AdminSubmission = TaskSubmission & { player: PlayerContext | null };
export type AdminWithdrawal = Withdrawal & { player: PlayerContext | null };

export interface AdminFlag {
  id: string;
  userId: string;
  kind: FlagKind;
  severity: "low" | "medium" | "high";
  detail: string;
  points: number;
  status: "open" | "confirmed" | "dismissed";
  createdAt: string;
  player: PlayerContext | null;
}

export interface AuditRow {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  summary: string;
  createdAt: string;
}

export interface AdminStats {
  users: number;
  pendingReviews: number;
  pendingPayouts: number;
  series: EarningsPoint[];
  categories: Array<{ category: string; completions: number }>;
  campaignSpend: number;
  fraudOpen: number;
  bannedUsers: number;
  walletLiability: number;
  pendingRewards: number;
  payoutQueueAmount: number;
  switches: { signupsOpen: boolean; questsOpen: boolean; withdrawalsOpen: boolean; aiAutopilot: boolean };
  campaignsWaiting: number;
}

export interface SharedAccount {
  uid: string;
  name: string;
  email: string;
  isBanned: boolean;
}

export interface AdminUserDetail {
  profile: UserProfile;
  security: {
    riskScore: number;
    risk: RiskLevel;
    trusted: boolean;
    submitted: number;
    approved: number;
    rejected: number;
    referralPaid: number;
    devices: number;
    ips: number;
  };
  referrals: number;
  sameDevice: SharedAccount[];
  sameIp: SharedAccount[];
  flags: Array<Omit<AdminFlag, "player">>;
  submissions: TaskSubmission[];
  withdrawals: Withdrawal[];
  audit: AuditRow[];
}

export type UserPatch = {
  isBanned?: boolean;
  banReason?: string;
  role?: "user" | "advertiser";
  grantCredits?: number;
  adjustBalance?: { amount: number; reason: string };
  trusted?: boolean;
  resetRisk?: boolean;
  message?: { title: string; body: string };
};

export type AdminCampaign = Campaign & { advertiserName: string };

export type AiRun = {
  id: string;
  trigger: "cron" | "manual";
  startedAt: string;
  finishedAt: string;
  report: string;
  actions: { tool: string; summary: string }[];
  error?: string;
};
export type AiStatus = { configured: boolean; enabled: boolean; runs: AiRun[] };

export type PaymentsOverview = {
  summary: {
    moneyIn: number;
    moneyIn30d: number;
    topups: number;
    premium: number;
    premiumSales: number;
    advertiserBalances: number;
    campaignMargin: number;
    pending: number;
    mismatches: number;
  };
  items: PaymentRecord[];
};

export const adminService = {
  stats: () => api<AdminStats>("/api/admin/stats"),

  users: () => api<AdminUser[]>("/api/admin/users"),
  user: (uid: string) => api<AdminUserDetail>(`/api/admin/users/${uid}`),
  updateUser: (uid: string, patch: UserPatch) =>
    api<{ uid: string }>(`/api/admin/users/${uid}`, { method: "PATCH", body: patch }),

  submissions: (status: "submitted" | "approved" | "rejected" | "all" = "submitted") =>
    api<AdminSubmission[]>(`/api/admin/submissions?status=${status}`),
  review: (id: string, decision: "approved" | "rejected", reason?: string, fraud?: boolean) =>
    api<{ id: string; status: string }>(`/api/submissions/${id}`, {
      method: "PATCH",
      body: { decision, reason, fraud },
    }),

  withdrawals: () => api<AdminWithdrawal[]>("/api/admin/withdrawals"),
  setWithdrawal: (id: string, status: WithdrawalStatus, notes?: string) =>
    api<Withdrawal>(`/api/withdrawals/${id}`, { method: "PATCH", body: { status, notes } }),

  flags: (status: "open" | "confirmed" | "dismissed" | "all" = "open") =>
    api<AdminFlag[]>(`/api/admin/fraud?status=${status}`),
  resolveFlag: (id: string, action: "dismiss" | "confirm") =>
    api<{ id: string }>(`/api/admin/fraud/${id}`, { method: "PATCH", body: { action } }),

  audit: () => api<AuditRow[]>("/api/admin/audit"),

  settings: () => api<SystemSettings>("/api/admin/settings"),
  saveSettings: (patch: Partial<SystemSettings>) =>
    api<SystemSettings>("/api/admin/settings", { method: "PATCH", body: patch }),

  campaigns: () => api<AdminCampaign[]>("/api/admin/campaigns"),
  setCampaign: (id: string, status: Extract<CampaignStatus, "active" | "paused" | "completed" | "rejected">, reason?: string) =>
    api<Campaign>(`/api/campaigns/${id}`, { method: "PATCH", body: { status, reason } }),

  payments: () => api<PaymentsOverview>("/api/admin/payments"),

  aiStatus: () => api<AiStatus>("/api/admin/ai/autopilot"),
  aiRun: () => api<AiRun>("/api/admin/ai/autopilot", { method: "POST" }),
  aiChat: (messages: { role: "user" | "assistant"; content: string }[]) =>
    api<{ text: string; actions: { tool: string; summary: string }[] }>("/api/admin/ai/chat", { method: "POST", body: { messages } }),

  tasks: () => api<Task[]>("/api/admin/tasks"),
  createTask: (input: QuestPayload & {
    title: string;
    description?: string;
    reward: number;
    xpReward?: number;
    maxCompletions?: number;
    minSeconds?: number;
    expiresInHours?: number;
  }): Promise<ApiResult<Task>> => api<Task>("/api/admin/tasks", { method: "POST", body: input }),
  updateTask: (id: string, patch: { status?: "open" | "expired"; reward?: number; maxCompletions?: number | null }) =>
    api<{ id: string }>(`/api/admin/tasks/${id}`, { method: "PATCH", body: patch }),
};

export const earningsService = {
  mine: () => api<EarningsPoint[]>("/api/earnings"),
};
