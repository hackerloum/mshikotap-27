import { api } from "@/lib/api-client";
import type { ApiResult, Campaign, CampaignStatus, CampaignType } from "@/types";

export const campaignsService = {
  list(scope?: "all"): Promise<ApiResult<Campaign[]>> {
    return api<Campaign[]>(`/api/campaigns${scope ? `?scope=${scope}` : ""}`);
  },

  create(input: {
    title: string;
    type: CampaignType;
    budgetCredits: number;
    costPerAction: number;
    instructions: string;
    targetUrl?: string;
  }): Promise<ApiResult<Campaign>> {
    return api<Campaign>("/api/campaigns", { method: "POST", body: input });
  },

  setStatus(id: string, status: CampaignStatus): Promise<ApiResult<Campaign>> {
    return api<Campaign>(`/api/campaigns/${id}`, { method: "PATCH", body: { status } });
  },
};
