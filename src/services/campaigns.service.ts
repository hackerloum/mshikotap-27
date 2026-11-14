import { api } from "@/lib/api-client";
import type { ApiResult, Campaign, CampaignStatus, QuestQuestion } from "@/types";

export type QuestionResult = {
  id: string;
  text: string;
  kind: QuestQuestion["kind"];
  counts?: Record<string, number>;
  average?: number;
  texts?: string[];
};
export type CampaignResults = { responses: number; questions: QuestionResult[] };

export type QuestPayload = {
  category: string;
  platform?: string;
  action?: string;
  targetUrl?: string;
  appName?: string;
  watchSeconds?: number;
  questions?: { text: string; kind: string; options?: string[]; correct?: number[] }[];
  passMark?: number;
  phrase?: string;
  notes?: string;
};

export const campaignsService = {
  list(scope?: "all"): Promise<ApiResult<Campaign[]>> {
    return api<Campaign[]>(`/api/campaigns${scope ? `?scope=${scope}` : ""}`);
  },

  results(id: string): Promise<ApiResult<CampaignResults>> {
    return api<CampaignResults>(`/api/campaigns/${id}/results`);
  },

  create(input: QuestPayload & { title: string; budgetCredits: number; costPerAction: number }): Promise<ApiResult<Campaign>> {
    return api<Campaign>("/api/campaigns", { method: "POST", body: input });
  },

  setStatus(id: string, status: CampaignStatus): Promise<ApiResult<Campaign>> {
    return api<Campaign>(`/api/campaigns/${id}`, { method: "PATCH", body: { status } });
  },
};
