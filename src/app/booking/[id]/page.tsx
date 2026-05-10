"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, notFound, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Calendar, Users, ShieldCheck, CheckCircle2, Loader2, Smartphone, AlertCircle } from "lucide-react";
import { getProperty } from "@/lib/data";
import { buildPriceBreakdown, formatKsh, nightsBetween } from "@/lib/pricing";
import type { Property } from "@/lib/types";

type Step = "form" | "payment" | "waiting" | "done" | "manual";

function BookingInner() {
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    getProperty(params.id).then((p) => alive && setProperty(p));
    return () => { alive = false; };
  }, [params.id]);

  const [checkIn, setCheckIn] = useState(search.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(search.get("checkOut") ?? "");
  const [guests, setGuests] = useState(Number(search.get("guests") ?? 1));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");

  const [step, setStep] = useState<Step>("form");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nights = nightsBetween(checkIn, checkOut);
  const previewNights = nights || 1;
  const breakdown = useMemo(
    () => (property ? buildPriceBreakdown(property, previewNights) : null),
    [property, previewNights]
  );

  // Stop polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  if (property === undefined) return <div className="pt-32 container-px">Loading...</div>;
  if (property === null) return notFound();
  if (property.listingType !== "short_stay") {
    if (typeof window !== "undefined") router.replace(`/listings/${property.id}`);
    return <div className="pt-32 container-px text-center"><p className="text-ink-500">Redirecting…</p></div>;
  }

  // ---- Step 1: save booking + send emails ----
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!checkIn || !checkOut || nights < 1) {
      setError("Please choose valid check-in and check-out dates.");
      return;
    }
    setSubmitting(true);
    try {
      const b = buildPriceBreakdown(property, nights);
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          guestName: name,
          guestEmail: email,
          guestPhone: phone,
          checkIn, checkOut, guests, nights,
          pricePerNight: b.perNight,
          subtotal: b.subtotal,
          serviceFee: b.serviceFee,
          total: b.total,
          ownerPayout: b.ownerPayout,
          agentProfit: b.agentProfit
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Booking failed.");
      setBookingId(json.id);
      setMpesaPhone(phone);
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err?.message ?? "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Step 2: trigger STK push ----
  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId || !breakdown) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/pay/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          phone: mpesaPhone,
          amount: buildPriceBreakdown(property, nights).total
        })
      });
      const json = await res.json();

      if (json.unconfigured) {
        // M-Pesa not set up yet — fall back to manual confirmation
        setStep("manual");
        return;
      }
      if (!res.ok || json.error) {
        setError(json.error ?? "Could not initiate M-Pesa payment.");
        return;
      }

      // Start polling for payment confirmation
      setStep("waiting");
      window.scrollTo({ top: 0, behavior: "smooth" });

      pollRef.current = setInterval(async () => {
        try {
          const poll = await fetch(`/api/pay/status/${bookingId}`);
          const status = await poll.json();
          if (status.paymentStatus === "paid") {
            clearInterval(pollRef.current!);
            setReceipt(status.mpesaReceiptNumber ?? null);
            setStep("done");
          } else if (status.paymentStatus === "failed") {
            clearInterval(pollRef.current!);
            setError("Payment was not completed. Please try again.");
            setStep("payment");
          }
        } catch {
          // transient network error — keep polling
        }
      }, 3000);
    } catch (err: any) {
      setError(err?.message ?? "Payment initiation failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Screens ----

  if (step === "done") {
    const final = buildPriceBreakdown(property, nights || 1);
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
          <h1 className="h-display text-3xl mb-2">Booking confirmed!</h1>
          <p className="text-ink-600">
            Payment received for <strong>{property.name}</strong>.
            {receipt && <> M-Pesa receipt: <span className="font-mono font-semibold">{receipt}</span>.</>}
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
            <InfoCard label="Check-in" value={checkIn} />
            <InfoCard label="Check-out" value={checkOut} />
            <InfoCard label="Total paid" value={formatKsh(final.total)} />
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/listings" className="btn-secondary px-5 py-2.5 text-sm">Browse more stays</Link>
            <Link href="/" className="btn-primary px-5 py-2.5 text-sm">Back home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "manual") {
    const final = buildPriceBreakdown(property, nights || 1);
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
            Thanks {name.split(" ")[0] || "there"}, we&apos;ve saved your booking for{" "}
            <strong>{property.name}</strong>. Our team will contact you on {phone} to confirm and
            arrange payment.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm">
            <InfoCard label="Check-in" value={checkIn} />
            <InfoCard label="Check-out" value={checkOut} />
            <InfoCard label="Total" value={formatKsh(final.total)} />
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/listings" className="btn-secondary px-5 py-2.5 text-sm">Browse more stays</Link>
            <Link href="/" className="btn-primary px-5 py-2.5 text-sm">Back home</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "waiting") {
    return (
      <div className="pt-32 pb-20 container-px max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-10 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-brand-50 border-2 border-brand-200 grid place-items-center mx-auto mb-5">
            <Smartphone size={26} className="text-brand-500" />
          </div>
          <h2 className="h-display text-2xl mb-2">Check your phone</h2>
          <p className="text-sm text-ink-600 mb-6">
            We sent an M-Pesa prompt to <span className="font-semibold">{mpesaPhone}</span>.
            Enter your M-Pesa PIN to complete payment.
          </p>
          <div className="flex items-center justify-center gap-2 text-brand-600 text-sm">
            <Loader2 size={16} className="animate-spin" />
            Waiting for confirmation…
          </div>
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setStep("payment");
            }}
            className="mt-8 text-sm text-ink-500 hover:text-ink-700 underline"
          >
            Cancel and try again
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="pt-32 pb-20 container-px max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8"
        >
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">Step 2 of 2</div>
            <h2 className="h-display text-2xl">Pay with M-Pesa</h2>
            <p className="text-sm text-ink-500 mt-1">
              We&apos;ll send a prompt to your phone. Enter your PIN to complete.
            </p>
          </div>

          {/* Price summary */}
          {breakdown && (
            <div className="bg-ink-50 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs text-ink-500 uppercase tracking-wider font-semibold mb-0.5">
                  Total due
                </div>
                <div className="text-2xl font-bold">{formatKsh(buildPriceBreakdown(property, nights).total)}</div>
              </div>
              <div className="text-right text-sm text-ink-500">
                <div>{property.name}</div>
                <div>{nights} night{nights !== 1 ? "s" : ""}</div>
              </div>
            </div>
          )}

          <form onSubmit={submitPayment} className="space-y-4">
            <div>
              <label className="label" htmlFor="mpesa-phone">M-Pesa phone number</label>
              <input
                id="mpesa-phone"
                type="tel"
                required
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="input"
                placeholder="0712 345 678"
              />
              <p className="text-xs text-ink-400 mt-1.5">Kenyan number — we&apos;ll send the STK push here.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" /> Sending prompt…
                </span>
              ) : (
                `Pay ${formatKsh(buildPriceBreakdown(property, nights).total)} via M-Pesa`
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
            <ShieldCheck size={13} className="text-brand-500 shrink-0" />
            Payment goes directly to your M-Pesa. No card details stored.
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Step 1: booking form ----
  return (
    <div className="pt-24 pb-16">
      <div className="container-px">
        <button onClick={() => router.back()} className="text-sm text-ink-500 hover:text-ink-900 mb-3">
          ← Back
        </button>
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">Step 1 of 2</div>
        <h1 className="h-display text-3xl sm:text-4xl">Confirm your stay</h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-10 mt-8">
          <form onSubmit={submitForm} className="space-y-6">
            <section className="card p-6">
              <h2 className="font-semibold mb-4">Your trip</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldDate icon={<Calendar size={14} />} label="Check-in" value={checkIn} onChange={setCheckIn} />
                <FieldDate icon={<Calendar size={14} />} label="Check-out" value={checkOut} onChange={setCheckOut} />
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
                <Field label="Phone" type="tel" value={phone} onChange={setPhone} />
              </div>
              <div className="mt-3">
                <label className="label">Anything we should know?</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input"
                  placeholder="Arrival time, special requests…"
                />
              </div>
            </section>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Continue to payment →"}
            </button>
          </form>

          <aside className="card p-6 lg:sticky lg:top-28 h-fit">
            <div className="flex gap-3 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={property.images[0]} alt="" className="w-20 h-20 rounded-2xl object-cover" />
              <div className="min-w-0">
                <div className="font-semibold line-clamp-1">{property.name}</div>
                <div className="text-sm text-ink-500 line-clamp-1">{property.location}</div>
                <div className="text-xs text-ink-500 mt-0.5">{property.type}</div>
              </div>
            </div>
            <div className="border-t border-ink-100 pt-4 space-y-2 text-sm">
              <Row
                label={`${formatKsh(breakdown!.perNight)} × ${previewNights} night${previewNights > 1 ? "s" : ""}`}
                value={formatKsh(breakdown!.subtotal)}
              />
              <Row label="Service fee (5%)" value={formatKsh(breakdown!.serviceFee)} />
              <div className="pt-3 border-t border-ink-100 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatKsh(breakdown!.total)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
              <ShieldCheck size={13} className="text-brand-500 shrink-0" />
              You won&apos;t be charged until the next step.
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
  label, value, onChange, icon, type = "text", min, max
}: {
  label: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; type?: string; min?: number; max?: number;
}) {
  return (
    <label className="block">
      <span className="label flex items-center gap-1.5">
        {icon && <span className="text-brand-500">{icon}</span>}
        {label}
      </span>
      <input
        type={type} min={min} max={max} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input" required
      />
    </label>
  );
}

function FieldDate({
  label, value, onChange, icon
}: {
  label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label flex items-center gap-1.5">
        {icon && <span className="text-brand-500">{icon}</span>}
        {label}
      </span>
      <input
        type="date" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input" required
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-ink-50 rounded-2xl px-4 py-3 text-left">
      <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</div>
      <div className="font-medium mt-0.5">{value || "—"}</div>
    </div>
  );
}
