"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, LogOut, ChevronRight, XCircle } from "lucide-react";
import { guestAuth, guestAuthHeaders, useGuestSession } from "@/lib/guest-auth";
import { formatKsh } from "@/lib/pricing";
import CancelBookingModal from "@/components/CancelBookingModal";

type BookingRow = {
  id: string;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total: number;
  created_at: string;
  property: {
    id: string;
    name: string;
    location: string;
    city: string;
    images: string[] | null;
    type: string;
  } | null;
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-ink-100 text-ink-700 ring-ink-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200"
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

export default function AccountBookings() {
  const session = useGuestSession();
  const [rows, setRows] = useState<BookingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<BookingRow | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/account/bookings", {
        headers: await guestAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load your bookings.");
        return;
      }
      setRows(json.bookings ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Network error.");
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    load();
  }, [session, load]);

  const displayName =
    (session?.user?.user_metadata?.full_name as string | undefined) ??
    session?.user?.email ??
    "";

  return (
    <div className="container-px max-w-5xl">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
            My account
          </div>
          <h1 className="h-display text-3xl sm:text-4xl">Your bookings</h1>
          {displayName && (
            <p className="text-sm text-ink-500 mt-1.5">Signed in as {displayName}</p>
          )}
        </div>
        <button
          onClick={async () => {
            await guestAuth.auth.signOut();
            window.location.href = "/";
          }}
          className="btn-secondary px-4 py-2 text-sm inline-flex items-center gap-1.5"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3 mb-6">{error}</div>
      )}

      {rows === null && !error && (
        <div className="text-sm text-ink-500">Loading…</div>
      )}

      {rows && rows.length === 0 && (
        <div className="card p-10 text-center">
          <h2 className="font-semibold text-lg">No bookings yet</h2>
          <p className="text-sm text-ink-500 mt-1">
            Once you book a stay, it&apos;ll show up here.
          </p>
          <Link href="/listings" className="btn-primary inline-flex mt-5 px-5 py-2.5 text-sm">
            Browse stays
          </Link>
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="grid gap-4">
          {rows.map((b) => {
            const img = b.property?.images?.[0];
            const tone = STATUS_TONE[b.status] ?? STATUS_TONE.pending;
            const canCancel = CANCELLABLE.has(b.status);
            return (
              <div key={b.id} className="card p-4 sm:p-5 flex gap-4 items-center">
                <Link href={`/booking/${b.id}`} className="shrink-0">
                  {img ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img}
                      alt=""
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-ink-100" />
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/booking/${b.id}`} className="font-semibold truncate hover:underline">
                      {b.property?.name ?? "Property"}
                    </Link>
                    <span
                      className={`text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ring-1 ${tone}`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <div className="text-sm text-ink-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin size={12} /> {b.property?.location ?? ""}
                  </div>
                  <div className="text-sm text-ink-600 flex items-center gap-1.5 mt-2">
                    <Calendar size={12} className="text-brand-500" />
                    {b.check_in} → {b.check_out} · {b.nights} night{b.nights !== 1 ? "s" : ""}
                  </div>
                  <div className="text-sm font-semibold mt-1">{formatKsh(b.total)}</div>
                </div>

                <div className="hidden sm:flex flex-col items-end gap-2">
                  {canCancel && (
                    <button
                      onClick={() => setCancelling(b)}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                    >
                      <XCircle size={13} /> Cancel
                    </button>
                  )}
                  <Link
                    href={`/booking/${b.id}`}
                    className="text-ink-400 hover:text-ink-700 transition-colors"
                    aria-label="Open booking"
                  >
                    <ChevronRight size={18} />
                  </Link>
                </div>

                {canCancel && (
                  <button
                    onClick={() => setCancelling(b)}
                    className="sm:hidden text-xs text-red-600 hover:underline shrink-0"
                  >
                    Cancel
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {cancelling && (
        <CancelBookingModal
          bookingId={cancelling.id}
          propertyName={cancelling.property?.name ?? "your booking"}
          checkIn={cancelling.check_in}
          actor="guest"
          onClose={() => setCancelling(null)}
          onDone={() => {
            setCancelling(null);
            load();
          }}
        />
      )}
    </div>
  );
}
