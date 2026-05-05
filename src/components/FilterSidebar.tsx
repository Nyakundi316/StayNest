"use client";

import { PropertyType } from "@/lib/types";

const TYPES: (PropertyType | "All")[] = [
  "All",
  "Studio",
  "Apartment",
  "House",
  "Villa",
  "Room"
];

export interface Filters {
  location: string;
  type: PropertyType | "All";
  minPrice: number;
  maxPrice: number;
  guests: number;
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

        <div>
          <label className="label">
            Price range (KSH / night)
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
