"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { marketplaceService } from "@/services/marketplace.service";
import { cn, formatCurrency } from "@/lib/utils";
import type { MarketplaceCategory, MarketplaceListing } from "@/types";

const categories: Array<{ id: MarketplaceCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "graphic_design", label: "Graphic design" },
  { id: "typing", label: "Typing" },
  { id: "video_editing", label: "Video editing" },
  { id: "social_promotion", label: "Social promotion" },
  { id: "writing", label: "Writing" },
  { id: "coding", label: "Coding" },
];

function categoryLabel(category: MarketplaceCategory) {
  return categories.find((c) => c.id === category)?.label ?? category;
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [category, setCategory] = useState<MarketplaceCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await marketplaceService.list({
        category,
        query: query.trim() || undefined,
      });
      if (cancelled) return;
      if (!result.ok) {
        toast.error(result.error.message);
        setListings([]);
      } else {
        setListings(result.data);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [category, query]);

  return (
    <div className="min-h-screen mesh-bg">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="animate-rise max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-300/80">
            Marketplace
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-semibold text-white">
            Hire skills. Ship faster.
          </h1>
          <p className="mt-3 text-slate-400">
            Browse public gigs from designers, editors, writers, and developers.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search listings…"
            aria-label="Search marketplace"
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-sm transition",
                  category === item.id
                    ? "bg-teal-400/15 text-teal-200 ring-1 ring-teal-400/40"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {loading ? (
            <p className="text-sm text-slate-400">Loading listings…</p>
          ) : listings.length === 0 ? (
            <EmptyState
              title="No listings found"
              description="Try another category or clear your search."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <Card key={listing.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{listing.title}</CardTitle>
                      <Badge tone="info">{categoryLabel(listing.category)}</Badge>
                    </div>
                    <CardDescription>{listing.sellerName}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    <p className="text-sm text-slate-400">{listing.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.tags.map((tag) => (
                        <Badge key={tag} tone="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-end justify-between border-t border-white/5 pt-4 text-sm">
                      <div>
                        <p className="font-[family-name:var(--font-display)] text-xl font-semibold text-white">
                          {formatCurrency(listing.price)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {listing.deliveryDays}d delivery · {listing.orders}{" "}
                          orders
                        </p>
                      </div>
                      <p className="text-teal-300">★ {listing.rating.toFixed(1)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
