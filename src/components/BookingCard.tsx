"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users, Star } from "lucide-react";
import { Property } from "@/lib/types";
import { buildPriceBreakdown, formatKsh, nightsBetween } from "@/lib/pricing";

interface Props {
  property: Property;
}

export default function BookingCard({ property }: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const nights = nightsBetween(checkIn, checkOut);
  // Show breakdown using a minimum of 1 night so the user can see what a stay would cost
  const previewNights = nights || 1;
  const breakdown = useMemo(
    () => buildPriceBreakdown(property, previewNights),
    [property, previewNights]
  );

  const onReserve = () => {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    params.set("guests", String(guests));
    router.push(`/booking/${property.id}?${params.toString()}`);
  };

  return (
    <div className="card p-6 lg:sticky lg:top-24">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold">
            {formatKsh(breakdown.perNight)}
          </div>
          <div className="text-sm text-ink-500">per night</div>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <Star size={14} className="fill-brand-500 text-brand-500" />
          <span className="font-medium">{property.rating.toFixed(2)}</span>
          <span className="text-ink-500">({property.reviews})</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <label className="px-3 py-2.5 rounded-2xl border border-ink-200 hover:border-ink-300 transition-colors">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1">
            <Calendar size={12} className="text-brand-500" /> Check-in
          </span>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-sm"
          />
        </label>
        <label className="px-3 py-2.5 rounded-2xl border border-ink-200 hover:border-ink-300 transition-colors">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1">
            <Calendar size={12} className="text-brand-500" /> Check-out
          </span>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-sm"
          />
        </label>
      </div>
      <label className="mt-2 block px-3 py-2.5 rounded-2xl border border-ink-200">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-1">
          <Users size={12} className="text-brand-500" /> Guests
        </span>
        <input
          type="number"
          min={1}
          max={property.guests}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full bg-transparent focus:outline-none text-sm"
        />
      </label>

      <button
        onClick={onReserve}
        className="mt-4 btn-primary w-full py-3 text-base"
      >
        Reserve
      </button>

      <p className="mt-2 text-center text-xs text-ink-500">
        You won't be charged yet
      </p>

      <div className="mt-5 pt-5 border-t border-ink-100 space-y-2 text-sm">
        <Row
          label={`${formatKsh(breakdown.perNight)} × ${previewNights} night${previewNights > 1 ? "s" : ""}`}
          value={formatKsh(breakdown.subtotal)}
        />
        <Row label="Service fee" value={formatKsh(breakdown.serviceFee)} />
        <div className="pt-3 border-t border-ink-100 flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>{formatKsh(breakdown.total)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
