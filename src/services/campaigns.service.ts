import { demoCampaigns } from "@/data/demo";
import { AppError, fromUnknown, ok } from "@/lib/errors/app-error";
import { activityService } from "@/services/activity.service";
import type { ApiResult, Campaign, CampaignStatus, CampaignType } from "@/types";

let campaigns = structuredClone(demoCampaigns);

export const campaignsService = {
  async list(advertiserId?: string): Promise<ApiResult<Campaign[]>> {
    const result = advertiserId
      ? campaigns.filter((c) => c.advertiserId === advertiserId)
      : campaigns;
    return ok(result);
  },

  async create(input: {
    advertiserId: string;
    title: string;
    type: CampaignType;
    budgetCredits: number;
    costPerAction: number;
    instructions: string;
    targetUrl?: string;
  }): Promise<ApiResult<Campaign>> {
    try {
      if (input.budgetCredits <= 0) {
        throw new AppError("INVALID_BUDGET", "Budget must be greater than zero");
      }
      const campaign: Campaign = {
        id: `camp-${Date.now()}`,
        advertiserId: input.advertiserId,
        title: input.title,
        type: input.type,
        status: "active",
        budgetCredits: input.budgetCredits,
        spentCredits: 0,
        costPerAction: input.costPerAction,
        targetUrl: input.targetUrl,
        instructions: input.instructions,
        completions: 0,
        createdAt: new Date().toISOString(),
      };
      campaigns = [campaign, ...campaigns];
      await activityService.log({
        actorId: input.advertiserId,
        action: "campaign.create",
        entityType: "campaign",
        entityId: campaign.id,
      });
      return ok(campaign);
    } catch (error) {
      return fromUnknown(error);
    }
  },

  async setStatus(
    id: string,
    status: CampaignStatus,
    actorId: string,
  ): Promise<ApiResult<Campaign>> {
    try {
      const index = campaigns.findIndex((c) => c.id === id);
      if (index < 0) throw new AppError("NOT_FOUND", "Campaign not found", 404);
      campaigns[index] = { ...campaigns[index], status };
      await activityService.log({
        actorId,
        action: `campaign.${status}`,
        entityType: "campaign",
        entityId: id,
      });
      return ok(campaigns[index]);
    } catch (error) {
      return fromUnknown(error);
    }
  },
};
