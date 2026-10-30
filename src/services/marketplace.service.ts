import { demoMarketplace } from "@/data/demo";
import { fromUnknown, ok } from "@/lib/errors/app-error";
import type { ApiResult, MarketplaceCategory, MarketplaceListing } from "@/types";

export const marketplaceService = {
  async list(filters?: {
    category?: MarketplaceCategory | "all";
    query?: string;
  }): Promise<ApiResult<MarketplaceListing[]>> {
    try {
      let result = [...demoMarketplace];
      if (filters?.category && filters.category !== "all") {
        result = result.filter((item) => item.category === filters.category);
      }
      if (filters?.query) {
        const q = filters.query.toLowerCase();
        result = result.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.tags.some((tag) => tag.includes(q)),
        );
      }
      return ok(result);
    } catch (error) {
      return fromUnknown(error);
    }
  },
};
