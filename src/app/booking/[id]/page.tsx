"use client";

import { Suspense, useMemo, useState } from "react";
import { useParams, useSearchParams, notFound, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { getProperty } from "@/lib/data";
import { buildPriceBreakdown, formatKsh, nightsBetween } from "@/lib/pricing";

function BookingInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const property = getProperty(params.id);
  if (!property) return notFound();

  const [checkIn, setCheckIn] = useState(search.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(search.get("checkOut") ?? "");
  const [guests, setGuests] = useState(Number(search.get("guests") ?? 1));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const nights = nightsBetween(checkIn, checkOut);
  const previewNights = nights || 1;
  const breakdown = useMemo(
    () => buildPriceBreakdown(property, previewNights),
    [property, previewNights]
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkIn || !checkOut || nights < 1) {
      alert("Please choose valid check-in and check-out dates.");
      return;
    }
    if (!name || !email || !phone) {
      alert("Please fill in your contact details.");
      return;
    }
    // In real app: POST to /api/bookings -> insert into Supabase
    setConfirmed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (confirmed) {
    return (
      <div className="pt-32 pb-20 container-px max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-10 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-brand-500 grid place-items-center text-white mx-auto mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="h-display text-3xl mb-2">Request received!</h1>
          <p className="text-ink-600">
            Thanks {name.split(" ")[0] || "there"}, we&apos;ve sent your request to our
            team. We&apos;ll confirm your stay at <strong>{property.name}</strong> within
            an hour and contact you on {phone}.
          </p>

          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
            <Card label="Check-in" value={checkIn} />
            <Card label="Check-out" value={checkOut} />
            <Card label="Total" value={formatKsh(buildPriceBreakdown(property, nights || 1).total)} />
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link href="/listings" className="btn-secondary px-5 py-2.5 text-sm">
              Browse more stays
            </Link>
            <Link href="/" className="btn-primary px-5 py-2.5 text-sm">
              Back home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container-px">
        <button
          onClick={() => router.back()}
          className="text-sm text-ink-500 hover:text-ink-900 mb-3"
        >
          ← Back
        </button>
        <h1 className="h-display text-3xl sm:text-4xl">Confirm your stay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-10 mt-8">
          <form onSubmit={submit} className="space-y-6">
            <section className="card p-6">
              <h2 className="font-semibold mb-4">Your trip</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldDate
                  icon={<Calendar size={14} />}
                  label="Check-in"
                  value={checkIn}
                  onChange={setCheckIn}
                />
                <FieldDate
                  icon={<Calendar size={14} />}
                  label="Check-out"
                  value={checkOut}
                  onChange={setCheckOut}
                />
                <Field
                  icon={<Users size={14} />}
                  label="Guests"
                  type="number"
                  min={1}
                  max={property.guests}
                  value={String(guests)}
                  onChange={(v) => setGuests(Number(v) || 1)}
                />
              </div>
            </section>

            <section className="card p-6">
              <h2 className="font-semibold mb-4">Your details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full name" value={name} onChange={setName} />
                <Field label="Email" type="email" value={email} onChange={setEmail} />
                <Field label="Phone" value={phone} onChange={setPhone} />
              </div>
              <div className="mt-3">
                <label className="label">Anything we should know?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Arrival time, special requests..."
                />
              </div>
            </section>

            <section className="card p-6">
              <h2 className="font-semibold mb-3">Payment</h2>
              <p className="text-sm text-ink-500 mb-4">
                Payment is collected after we confirm availability.
                M-Pesa and card payments will be available at check-in.
              </p>
              <div className="flex items-center gap-2 text-sm text-ink-700">
                <ShieldCheck size={16} className="text-brand-500" />
                Your details are protected. No charges will be made yet.
              </div>
            </section>

            <button type="submit" className="btn-primary w-full py-3.5 text-base">
              Confirm booking request
            </button>
          </form>

          {/* Summary */}
          <aside className="card p-6 lg:sticky lg:top-24 h-fit">
            <div className="flex gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.images[0]}
                alt=""
                className="w-20 h-20 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <div className="font-semibold line-clamp-1">{property.name}</div>
                <div className="text-sm text-ink-500 line-clamp-1">{property.location}</div>
                <div className="text-xs text-ink-500 mt-0.5">{property.type}</div>
              </div>
            </div>

            <div className="border-t border-ink-100 pt-4 space-y-2 text-sm">
              <Row label={`${formatKsh(breakdown.perNight)} × ${previewNights} night${previewNights > 1 ? "s" : ""}`} value={formatKsh(breakdown.subtotal)} />
              <Row label="Service fee" value={formatKsh(breakdown.serviceFee)} />
              <div className="pt-3 border-t border-ink-100 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatKsh(breakdown.total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="pt-32 container-px">Loading...</div>}>
      <BookingInner />
    </Suspense>
  );
}

function Field({
  label,
  value,
  onChange,
  icon,
  type = "text",
  min,
  max
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="label flex items-center gap-1.5">
        {icon && <span className="text-brand-500">{icon}</span>}
        {label}
      </span>
      <input
        type={type}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        required
      />
    </label>
  );
}

function FieldDate({
  label,
  value,
  onChange,
  icon
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label flex items-center gap-1.5">
        {icon && <span className="text-brand-500">{icon}</span>}
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        required
      />
    </label>
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

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-50 rounded-2xl px-4 py-3 text-left">
      <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</div>
      <div className="font-medium mt-0.5">{value || "—"}</div>
    </div>
  );
}
