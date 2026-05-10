"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getProperties } from "@/lib/data";
import PropertyCard from "@/components/PropertyCard";
import FilterSidebar, { Filters } from "@/components/FilterSidebar";
import SearchBar from "@/components/SearchBar";
import { clientPriceFor, LISTING_TYPE_LABELS } from "@/lib/pricing";
import { ListingType, Property, PropertyType } from "@/lib/types";
import { SlidersHorizontal, ArrowUpDown } from "lucide-react";

type SortOption = "default" | "price-asc" | "price-desc" | "rating" | "newest";

const SORT_LABELS: Record<SortOption, string> = {
  "default":    "Default",
  "price-asc":  "Price: Low → High",
  "price-desc": "Price: High → Low",
  "rating":     "Top rated",
  "newest":     "Newest"
};

function ListingsInner() {
  const params = useSearchParams();

  const initial: Filters = {
    location:    params.get("location") ?? "",
    type:        (params.get("type") as PropertyType | null) ?? "All",
    listingType: (params.get("listingType") as ListingType | null) ?? "All",
    minPrice:    Number(params.get("minPrice") ?? 0),
    maxPrice:    Number(params.get("maxPrice") ?? 0),
    guests:      Number(params.get("guests") ?? 1) || 1,
    bedrooms:    Number(params.get("bedrooms") ?? 0)
  };

  const [filters, setFilters] = useState<Filters>(initial);
  const [sort, setSort] = useState<SortOption>("default");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getProperties()
      .then((p) => alive && setProperties(p))
      .catch((e) => alive && setError(e.message ?? "Failed to load stays"));
    return () => { alive = false; };
  }, []);

  // Sync filters when URL params change (e.g. SearchBar navigation)
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      location:    params.get("location") ?? f.location,
      type:        (params.get("type") as PropertyType | null) ?? f.type,
      listingType: (params.get("listingType") as ListingType | null) ?? f.listingType,
      guests:      Number(params.get("guests") ?? f.guests) || f.guests,
      bedrooms:    Number(params.get("bedrooms") ?? 0)
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const filtered = useMemo(() => {
    if (!properties) return [];
    return properties.filter((p) => {
      const { amount } = clientPriceFor(p);
      if (filters.location && !`${p.location} ${p.city}`.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.type !== "All" && p.type !== filters.type) return false;
      if (filters.listingType !== "All" && p.listingType !== filters.listingType) return false;
      if (filters.listingType === "short_stay" && filters.guests > 1 && p.guests < filters.guests) return false;
      if (filters.bedrooms && p.bedrooms < filters.bedrooms) return false;
      if (filters.minPrice && amount < filters.minPrice) return false;
      if (filters.maxPrice && amount > filters.maxPrice) return false;
      return true;
    });
  }, [filters, properties]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "price-asc":  return arr.sort((a, b) => clientPriceFor(a).amount - clientPriceFor(b).amount);
      case "price-desc": return arr.sort((a, b) => clientPriceFor(b).amount - clientPriceFor(a).amount);
      case "rating":     return arr.sort((a, b) => b.rating - a.rating);
      case "newest":     return arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:           return arr;
    }
  }, [filtered, sort]);

  const reset = () => {
    setFilters({ location: "", type: "All", listingType: "All", minPrice: 0, maxPrice: 0, guests: 1, bedrooms: 0 });
    setSort("default");
  };

  // Group by listing type when "All" is active
  const grouped = useMemo(() => {
    if (filters.listingType !== "All") return null;
    const acc: Record<ListingType, Property[]> = { short_stay: [], sale: [], lease: [] };
    for (const p of sorted) acc[p.listingType].push(p);
    return acc;
  }, [sorted, filters.listingType]);

  const heading =
    filters.listingType === "sale"    ? "Houses for sale"
    : filters.listingType === "lease" ? "Houses for lease"
    : filters.listingType === "short_stay" ? "Short stays"
    : "All listings";

  return (
    <div className="pt-20 pb-16">
      {/* Search bar — pre-populated from current URL, adapts to active listing type */}
      <div className="container-px py-6">
        <SearchBar variant="page" activeListingType={filters.listingType} />
      </div>

      <div className="container-px grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-8 mt-2">
        {/* Mobile filter toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileFilters((v) => !v)}
            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            <SlidersHorizontal size={14} />
            {showMobileFilters ? "Hide filters" : "Filters"}
          </button>
        </div>

        <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
          <FilterSidebar filters={filters} onChange={setFilters} onReset={reset} />
        </div>

        <div>
          {/* Header: title + result count + sort */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="h-display text-2xl sm:text-3xl">{heading}</h1>
              <p className="text-sm text-ink-500 mt-1">
                {properties === null
                  ? "Loading…"
                  : `${sorted.length} ${sorted.length === 1 ? "result" : "results"}`}
              </p>
            </div>

            {sorted.length > 1 && (
              <label className="flex items-center gap-2 text-sm text-ink-600 shrink-0">
                <ArrowUpDown size={14} className="text-ink-400" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="input py-2 text-sm w-auto pr-8"
                >
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {error && (
            <div className="card p-6 text-red-600 mb-4">Couldn&apos;t load listings: {error}</div>
          )}

          {properties === null ? (
            <SkeletonGrid />
          ) : sorted.length === 0 ? (
            <EmptyState onReset={reset} />
          ) : grouped ? (
            // "All" view — grouped by listing type
            <div className="space-y-10">
              {(["short_stay", "sale", "lease"] as ListingType[]).map((kind) => {
                const list = grouped[kind];
                if (!list.length) return null;
                return (
                  <section key={kind}>
                    <h2 className="font-display text-xl mb-4">
                      {LISTING_TYPE_LABELS[kind]}
                      <span className="text-ink-500 font-normal text-sm ml-2">({list.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {list.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            // Single listing type — flat grid
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {sorted.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-3xl mb-3">🏝️</div>
      <div className="font-semibold mb-1">No listings match your filters</div>
      <p className="text-sm text-ink-500 mb-4">
        Try widening your price range, removing the location, or changing the property type.
      </p>
      <button onClick={onReset} className="btn-primary px-4 py-2 text-sm">
        Reset all filters
      </button>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/3] rounded-3xl bg-ink-100" />
          <div className="h-4 bg-ink-100 rounded mt-3 w-2/3" />
          <div className="h-3 bg-ink-100 rounded mt-2 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="pt-32 container-px">Loading…</div>}>
      <ListingsInner />
    </Suspense>
  );
}
