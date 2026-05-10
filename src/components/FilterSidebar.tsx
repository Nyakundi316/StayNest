"use client";

import { ListingType, PropertyType } from "@/lib/types";

const TYPES: (PropertyType | "All")[] = ["All", "Studio", "Apartment", "House", "Villa", "Room"];

const LISTINGS: { value: ListingType | "All"; label: string }[] = [
  { value: "All", label: "All" },
  { value: "short_stay", label: "Short stay" },
  { value: "sale", label: "For sale" },
  { value: "lease", label: "For lease" }
];

export interface Filters {
  location: string;
  type: PropertyType | "All";
  listingType: ListingType | "All";
  minPrice: number;
  maxPrice: number;
  guests: number;
  bedrooms: number; // 0 = any
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}

export default function FilterSidebar({ filters, onChange, onReset }: Props) {
  return (
    <aside className="card p-6 h-fit lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-brand-600 hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="label">Listing</label>
          <div className="flex flex-wrap gap-2">
            {LISTINGS.map((l) => {
              const active = filters.listingType === l.value;
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => onChange({ ...filters, listingType: l.value })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? "bg-brand-500 text-white border-brand-500"
                      : "border-ink-200 text-ink-700 hover:border-ink-300"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Location</label>
          <input
            type="text"
            placeholder="City or area"
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="input"
          />
        </div>

        <div>
          <label className="label">Property type</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const active = filters.type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ ...filters, type: t })}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    active
                      ? "bg-ink-900 text-white border-ink-900"
                      : "border-ink-200 text-ink-700 hover:border-ink-300"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {filters.listingType !== "sale" && filters.listingType !== "lease" && (
          <div>
            <label className="label">Guests (min)</label>
            <input
              type="number"
              min={1}
              value={filters.guests}
              onChange={(e) =>
                onChange({ ...filters, guests: Math.max(1, Number(e.target.value) || 1) })
              }
              className="input"
            />
          </div>
        )}

        {filters.listingType !== "short_stay" && (
          <div>
            <label className="label">Bedrooms (min)</label>
            <input
              type="number"
              min={0}
              value={filters.bedrooms || ""}
              onChange={(e) =>
                onChange({ ...filters, bedrooms: Math.max(0, Number(e.target.value) || 0) })
              }
              placeholder="Any"
              className="input"
            />
          </div>
        )}

        <div>
          <label className="label">
            Price range (KSH){filters.listingType === "lease" ? " / month" : filters.listingType === "short_stay" ? " / night" : ""}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              step={500}
              value={filters.minPrice || ""}
              onChange={(e) =>
                onChange({ ...filters, minPrice: Number(e.target.value) || 0 })
              }
              placeholder="Min"
              className="input"
            />
            <input
              type="number"
              min={0}
              step={500}
              value={filters.maxPrice || ""}
              onChange={(e) =>
                onChange({ ...filters, maxPrice: Number(e.target.value) || 0 })
              }
              placeholder="Max"
              className="input"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
