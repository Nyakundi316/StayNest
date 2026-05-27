"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, MailCheck } from "lucide-react";

export default function FindBookingPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/booking/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Try again.");
        return;
      }
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="pt-32 pb-20 container-px max-w-md text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mb-4">
          <MailCheck size={22} />
        </div>
        <h1 className="h-display text-2xl mb-2">Check your inbox</h1>
        <p className="text-sm text-ink-500">
          If we found any bookings on <strong>{email}</strong>, we&apos;ve emailed you
          a link to each one. Links are valid for 90 days.
        </p>
        <p className="text-xs text-ink-400 mt-3">
          Didn&apos;t get anything within a few minutes? Check your spam folder, then
          give us a call on +254 708 781 407.
        </p>
        <Link href="/" className="btn-secondary inline-flex mt-6 px-5 py-2.5 text-sm">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 container-px max-w-md">
      <div className="mb-7">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
          Manage your booking
        </div>
        <h1 className="h-display text-3xl">Find your booking</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          Lost the email with your private link? Enter the address you booked with
          and we&apos;ll send a fresh one.
        </p>
      </div>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="label" htmlFor="find-email">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              id="find-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-9"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3 text-sm disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Email me my booking link
        </button>

        <p className="text-xs text-ink-500 text-center">
          Have an account?{" "}
          <Link href="/account/login" className="text-brand-600 hover:underline font-medium">
            Sign in instead
          </Link>
        </p>
      </form>
    </div>
  );
}
