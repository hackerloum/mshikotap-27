"use client";

import { useEffect, useState } from "react";
import { Clock, Search } from "lucide-react";
import { toast } from "sonner";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Badge } from "@/components/ui/badge";
import { Star } from "@/components/ui/coin";
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

const avatarTones = [
  "bg-coin text-ink-950",
  "bg-mint text-ink-950",
  "bg-sky text-ink-950",
  "bg-flame text-ink-950",
  "bg-coral text-white",
];

function toneFor(name: string) {
  let sum = 0;
  for (const ch of name) sum += ch.charCodeAt(0);
  return avatarTones[sum % avatarTones.length];
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
    <div className="min-h-dvh bg-ink-950 text-slate-100">
      <MarketingHeader />
      <main>
        <section className="dots border-b-2 border-ink-800">
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:pb-12 sm:pt-14">
            <p className="text-xs font-extrabold uppercase tracking-wider text-sky">
              Marketplace
            </p>
            <h1 className="mt-2 max-w-2xl font-display text-4xl leading-[1.05] text-white sm:text-6xl">
              Find a <span className="scribble text-coin">gig</span> you love
            </h1>
            <p className="mt-3 max-w-xl text-base font-semibold text-slate-300 sm:text-lg">
              Designers, editors, writers and coders. Pick a pro and get it
              done.
            </p>

            <div className="relative mt-6 max-w-md">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search gigs…"
                aria-label="Search marketplace"
                className="pl-12"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4">
          <div className="-mx-4 mt-6 overflow-x-auto px-4 hide-scrollbar">
            <div
              className="flex w-max gap-2 pb-2"
              role="tablist"
              aria-label="Gig categories"
            >
              {categories.map((item) => {
                const active = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(item.id)}
                    className={cn(
                      "h-11 shrink-0 whitespace-nowrap rounded-full border-2 px-4 font-display text-base transition active:translate-y-px",
                      active
                        ? "border-coin bg-coin text-ink-950 shadow-[0_3px_0_0_var(--color-coin-deep)]"
                        : "border-ink-600 bg-ink-800 text-slate-200 hover:bg-ink-700",
                    )}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="py-8">
            {loading ? (
              <p className="text-sm font-semibold text-slate-400">
                Loading gigs…
              </p>
            ) : listings.length === 0 ? (
              <EmptyState
                title="No gigs here yet"
                description="Try another category or clear your search."
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <article
                    key={listing.id}
                    className="flex flex-col rounded-3xl border-2 border-ink-700 bg-ink-900 p-5 shadow-[0_5px_0_0_var(--color-ink-700)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Badge tone="info" className="max-w-[70%] truncate">
                        {categoryLabel(listing.category)}
                      </Badge>
                      <span className="shrink-0 rounded-xl bg-coin px-3 py-1 font-display text-lg leading-tight text-ink-950 shadow-[0_3px_0_0_var(--color-coin-deep)]">
                        {formatCurrency(listing.price)}
                      </span>
                    </div>

                    <h2 className="mt-4 font-display text-xl leading-tight text-white">
                      {listing.title}
                    </h2>
                    <p className="mt-2 text-sm font-semibold text-slate-400">
                      {listing.description}
                    </p>

                    {listing.tags.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {listing.tags.map((tag) => (
                          <Badge key={tag} tone="default">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-ink-800 pt-4">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-ink-950 font-display text-lg",
                            toneFor(listing.sellerName),
                          )}
                        >
                          {listing.sellerName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-white">
                            {listing.sellerName}
                          </p>
                          <p className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {listing.deliveryDays}d · {listing.orders} orders
                          </p>
                        </div>
                      </div>
                      <p
                        className="flex shrink-0 items-center gap-1 font-display text-lg text-white"
                        aria-label={`Rated ${listing.rating.toFixed(1)}`}
                      >
                        <Star size={20} />
                        {listing.rating.toFixed(1)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
