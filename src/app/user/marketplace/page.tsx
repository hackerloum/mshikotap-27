"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Search, ShoppingBag, Star as StarIcon } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label } from "@/components/ui/input";
import { marketplaceService } from "@/services/marketplace.service";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
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
    <DashboardShell role="user" title="Market">
      <div className="space-y-6">
        <div className="space-y-3">
          <div>
            <Label htmlFor="mkt-search">Find a gig</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <Input
                id="mkt-search"
                className="pl-12"
                placeholder="Design, typing, coding…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={category === cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "min-h-11 shrink-0 whitespace-nowrap rounded-2xl border-2 px-4 text-sm font-extrabold capitalize transition active:translate-y-px",
                  category === cat
                    ? "border-coin-deep bg-coin text-ink-950 shadow-[0_3px_0_0_var(--color-coin-deep)]"
                    : "border-ink-700 bg-ink-900 text-slate-300 hover:border-ink-600",
                )}
              >
                {cat.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Try another category or a different search."
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {listings.map((item) => (
              <Card key={item.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky/20 text-sky">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-xl leading-tight text-white">
                        {item.title}
                      </h3>
                      <p className="mt-0.5 truncate text-xs font-extrabold uppercase tracking-wider text-slate-400">
                        by {item.sellerName}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-2xl bg-coin px-3 py-1.5 font-display text-lg text-ink-950 shadow-[0_3px_0_0_var(--color-coin-deep)]">
                    {formatCurrency(item.price)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-300">{item.description}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{item.category.replaceAll("_", " ")}</Badge>
                  <Badge tone="info">
                    <StarIcon className="h-3 w-3" />
                    {item.rating}
                  </Badge>
                  <Badge tone="success">
                    {formatNumber(item.orders)} orders
                  </Badge>
                  <Badge tone="warning">
                    <Clock className="h-3 w-3" />
                    {item.deliveryDays}d
                  </Badge>
                </div>

                {item.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-ink-800 px-2 py-0.5 text-xs font-bold text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <Button
                  variant="sky"
                  className="mt-5 w-full"
                  onClick={() =>
                    toast.success(`Demo order started for “${item.title}”`)
                  }
                >
                  Hire (demo)
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
