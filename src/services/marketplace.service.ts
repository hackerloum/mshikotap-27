import { api } from "@/lib/api-client";
import type { ApiResult, MarketplaceCategory, MarketplaceListing } from "@/types";

export const marketplaceService = {
  list(filters?: { category?: MarketplaceCategory | "all"; query?: string }): Promise<ApiResult<MarketplaceListing[]>> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== "all") params.set("category", filters.category);
    if (filters?.query) params.set("q", filters.query);
    return api<MarketplaceListing[]>(`/api/marketplace?${params}`, { auth: false });
  },
};
