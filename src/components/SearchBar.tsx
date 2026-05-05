"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Calendar, Users, Search } from "lucide-react";

interface Props {
  variant?: "hero" | "page";
}

export default function SearchBar({ variant = "hero" }: Props) {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);
    router.push(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className={`bg-white rounded-3xl shadow-card p-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_auto] items-stretch ${
        variant === "hero" ? "" : "border border-ink-100"
      }`}
    >
      <Field icon={<MapPin size={16} />} label="Where">
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Nairobi, Diani, Naivasha..."
          className="w-full bg-transparent focus:outline-none text-sm"
        />
      </Field>
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

function Field({
  icon,
  label,
  children
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
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
