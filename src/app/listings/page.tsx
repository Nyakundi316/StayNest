"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { properties } from "@/lib/data";
import PropertyCard from "@/components/PropertyCard";
import FilterSidebar, { Filters } from "@/components/FilterSidebar";
import SearchBar from "@/components/SearchBar";
import { clientPricePerNight } from "@/lib/pricing";
import { PropertyType } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";

function ListingsInner() {
  const params = useSearchParams();

  const initial: Filters = {
    location: params.get("location") ?? "",
    type: (params.get("type") as PropertyType | null) ?? "All",
    minPrice: 0,
    maxPrice: 0,
    guests: Number(params.get("guests") ?? 1) || 1
  };

  const [filters, setFilters] = useState<Filters>(initial);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Resync if URL params change
  useEffect(() => {
    setFilters((f) => ({
      ...f,
      location: params.get("location") ?? f.location,
      type: (params.get("type") as PropertyType | null) ?? f.type,
      guests: Number(params.get("guests") ?? f.guests) || f.guests
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      const price = clientPricePerNight(p);
      if (filters.location && !`${p.location} ${p.city}`.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.type !== "All" && p.type !== filters.type) return false;
      if (filters.guests && p.guests < filters.guests) return false;
      if (filters.minPrice && price < filters.minPrice) return false;
      if (filters.maxPrice && price > filters.maxPrice) return false;
      return true;
    });
  }, [filters]);

  const reset = () =>
    setFilters({ location: "", type: "All", minPrice: 0, maxPrice: 0, guests: 1 });

  return (
    <div className="pt-20 pb-16">
      <div className="container-px py-6">
        <SearchBar variant="page" />
      </div>

      <div className="container-px grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-8 mt-4">
        {/* Mobile filter toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileFilters((v) => !v)}
            className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
          >
            <SlidersHorizontal size={14} />
            {showMobileFilters ? "Hide filters" : "Show filters"}
          </button>
        </div>

        <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
          <FilterSidebar filters={filters} onChange={setFilters} onReset={reset} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="h-display text-2xl sm:text-3xl">Available stays</h1>
              <p className="text-sm text-ink-500 mt-1">
                {filtered.length} {filtered.length === 1 ? "stay" : "stays"} found
              </p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-2xl mb-2">🏝️</div>
              <div className="font-semibold mb-1">No stays match your filters</div>
              <p className="text-sm text-ink-500 mb-4">
                Try widening your price range or clearing the location.
              </p>
              <button onClick={reset} className="btn-primary px-4 py-2 text-sm">
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="pt-32 container-px">Loading...</div>}>
      <ListingsInner />
    </Suspense>
  );
}
