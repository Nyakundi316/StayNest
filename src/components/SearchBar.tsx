"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { MapPin, Calendar, Users, Search, BedDouble } from "lucide-react";
import { ListingType } from "@/lib/types";

interface Props {
  variant?: "hero" | "page";
  // When on the listings page, pass the current active listing type so the
  // date/guest fields show/hide correctly and match what the user is browsing.
  activeListingType?: ListingType | "All";
}

// useSearchParams() must sit behind a Suspense boundary or `next build` fails
// when this bar is rendered on a statically-generated route (e.g. the home page
// hero). Wrapping here keeps every call site safe without extra boilerplate.
export default function SearchBar(props: Props) {
  return (
    <Suspense fallback={<SearchBarSkeleton variant={props.variant ?? "hero"} />}>
      <SearchBarInner {...props} />
    </Suspense>
  );
}

function SearchBarInner({ variant = "hero", activeListingType }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  // For the page variant, pre-populate from the current URL so the bar
  // reflects what the user is already filtering by.
  const [location, setLocation] = useState(
    variant === "page" ? (params.get("location") ?? "") : ""
  );
  const [checkIn, setCheckIn] = useState(
    variant === "page" ? (params.get("checkIn") ?? "") : ""
  );
  const [checkOut, setCheckOut] = useState(
    variant === "page" ? (params.get("checkOut") ?? "") : ""
  );
  const [guests, setGuests] = useState(
    variant === "page" ? (params.get("guests") ?? "") : ""
  );
  const [bedrooms, setBedrooms] = useState(
    variant === "page" ? (params.get("bedrooms") ?? "") : ""
  );

  // The effective listing type governs which fields are visible.
  // "All" and undefined both show the short-stay layout (most fields).
  const effectiveType: ListingType =
    activeListingType === "sale" ? "sale"
    : activeListingType === "lease" ? "lease"
    : "short_stay";

  const isStay = effectiveType === "short_stay";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (activeListingType && activeListingType !== "All") q.set("listingType", activeListingType);
    if (location) q.set("location", location);
    if (isStay) {
      if (checkIn) q.set("checkIn", checkIn);
      if (checkOut) q.set("checkOut", checkOut);
      if (guests) q.set("guests", guests);
    } else {
      if (bedrooms) q.set("bedrooms", bedrooms);
    }
    router.push(`/listings${q.toString() ? `?${q}` : ""}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`bg-white rounded-3xl shadow-card p-2 grid gap-2 sm:grid-cols-2 items-stretch ${
        isStay
          ? "lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto]"
          : "lg:grid-cols-[1.6fr_1fr_auto]"
      } ${variant === "page" ? "border border-ink-100" : ""}`}
    >
      <Field icon={<MapPin size={16} />} label="Where">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={
            effectiveType === "sale" ? "Lavington, Karen, Diani…"
            : effectiveType === "lease" ? "Westlands, Kilimani, Karen…"
            : "Nairobi, Diani, Naivasha…"
          }
          className="w-full bg-transparent focus:outline-none text-sm"
        />
      </Field>

      {isStay && (
        <>
          <Field icon={<Calendar size={16} />} label="Check-in">
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-sm"
            />
          </Field>
          <Field icon={<Calendar size={16} />} label="Check-out">
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-sm"
            />
          </Field>
          <Field icon={<Users size={16} />} label="Guests">
            <input
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="2"
              className="w-full bg-transparent focus:outline-none text-sm"
            />
          </Field>
        </>
      )}

      {!isStay && (
        <Field icon={<BedDouble size={16} />} label="Bedrooms">
          <input
            type="number"
            min={1}
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            placeholder="2+"
            className="w-full bg-transparent focus:outline-none text-sm"
          />
        </Field>
      )}

      <button
        type="submit"
        className="btn-primary px-5 py-3 lg:rounded-2xl rounded-2xl flex items-center justify-center gap-2"
      >
        <Search size={16} />
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}

// Matches the bar's footprint so the hero doesn't jump while params resolve.
function SearchBarSkeleton({ variant }: { variant: "hero" | "page" }) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-card p-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] ${
        variant === "page" ? "border border-ink-100" : ""
      }`}
      aria-hidden
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-4 py-2.5">
          <div className="h-3 w-16 bg-ink-100 rounded animate-pulse" />
          <div className="h-4 w-24 bg-ink-100 rounded mt-2 animate-pulse" />
        </div>
      ))}
      <div className="bg-ink-100 rounded-2xl animate-pulse min-h-[3rem]" />
    </div>
  );
}

function Field({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col px-4 py-2.5 rounded-2xl hover:bg-ink-50 transition-colors cursor-text">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1.5">
        <span className="text-brand-500">{icon}</span>
        {label}
      </span>
      <span className="mt-1">{children}</span>
    </label>
  );
}
