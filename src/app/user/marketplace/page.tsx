"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { marketplaceService } from "@/services/marketplace.service";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { MarketplaceCategory, MarketplaceListing } from "@/types";
import { toast } from "sonner";

const categories: Array<MarketplaceCategory | "all"> = [
  "all",
  "graphic_design",
  "typing",
  "video_editing",
  "social_promotion",
  "writing",
  "coding",
];

export default function UserMarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory | "all">("all");

  const load = useCallback(async () => {
    const res = await marketplaceService.list({ category, query });
    if (res.ok) setListings(res.data);
  }, [category, query]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardShell role="user" title="Marketplace">
      <div className="space-y-6 animate-rise">
        <Card>
          <CardContent className="flex flex-col gap-3 pt-5 md:flex-row md:items-end">
            <div className="flex-1">
              <Label htmlFor="mkt-search">Search services</Label>
              <Input
                id="mkt-search"
                placeholder="Design, typing, coding…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={category === cat ? "default" : "secondary"}
                  onClick={() => setCategory(cat)}
                >
                  {cat.replaceAll("_", " ")}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {listings.length === 0 ? (
          <EmptyState
            title="No listings"
            description="Try a different category or search term."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map((item) => (
              <Card key={item.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {item.sellerName} · {item.description}
                    </p>
                  </div>
                  <Badge tone="brand">{formatCurrency(item.price)}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.category.replaceAll("_", " ")}</Badge>
                    <Badge tone="info">★ {item.rating}</Badge>
                    <Badge tone="success">
                      {formatNumber(item.orders)} orders
                    </Badge>
                    <Badge>{item.deliveryDays}d delivery</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast.success(`Demo order started for “${item.title}”`)
                    }
                  >
                    Hire (demo)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
