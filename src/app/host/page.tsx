"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Home as HomeIcon,
  CalendarDays,
  Wallet,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  XCircle
} from "lucide-react";
import { formatKsh } from "@/lib/pricing";
import { guestAuthHeaders } from "@/lib/guest-auth";
import CancelBookingModal from "@/components/CancelBookingModal";

type Owner = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  payoutMethod: string | null;
};

type HostProperty = {
  id: string;
  name: string;
  location: string;
  city: string;
  type: string;
  listingType: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  guests: number;
  ownerBasePrice: number;
  available: boolean;
  archived: boolean;
  rating: number;
  reviews: number;
};

type HostBooking = {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  ownerPayout: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

type Overview = {
  owner: Owner | null;
  properties: HostProperty[];
  bookings: HostBooking[];
  totals: {
    properties: number;
    upcomingBookings: number;
    totalPayout: number;
  };
};

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-ink-100 text-ink-700 ring-ink-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200"
};

const CANCELLABLE = new Set(["pending", "confirmed"]);

export default function HostDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<HostBooking | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/host/overview", {
        headers: await guestAuthHeaders()
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not load host data.");
        return;
      }
      setError(null);
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? "Network error.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="container-px py-10 max-w-3xl">
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-2xl px-4 py-3">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="container-px py-10 text-sm text-ink-500">Loading…</div>;
  }

  const propertyName = (id: string) =>
    data.properties.find((p) => p.id === id)?.name ?? "Property";

  return (
    <div className="container-px py-10 max-w-6xl">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
          Welcome back{data.owner ? `, ${data.owner.name.split(" ")[0]}` : ""}
        </div>
        <h1 className="h-display text-3xl sm:text-4xl">Your host dashboard</h1>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Stat
          icon={<HomeIcon size={16} />}
          label="Properties"
          value={String(data.totals.properties)}
        />
        <Stat
          icon={<CalendarDays size={16} />}
          label="Upcoming bookings"
          value={String(data.totals.upcomingBookings)}
        />
        <Stat
          icon={<Wallet size={16} />}
          label="Total payout"
          value={formatKsh(data.totals.totalPayout)}
        />
      </div>

      {data.owner && (
        <div className="card p-5 mb-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5 text-ink-700">
            <Phone size={13} className="text-brand-500" />
            {data.owner.phone}
          </div>
          {data.owner.email && (
            <div className="flex items-center gap-1.5 text-ink-700">
              <Mail size={13} className="text-brand-500" />
              {data.owner.email}
            </div>
          )}
          {data.owner.payoutMethod && (
            <div className="flex items-center gap-1.5 text-ink-700">
              <Wallet size={13} className="text-brand-500" />
              Payout via {data.owner.payoutMethod}
            </div>
          )}
        </div>
      )}

      <section className="mb-12">
        <h2 className="font-semibold text-lg mb-4">Your listings</h2>
        {data.properties.length === 0 ? (
          <p className="text-sm text-ink-500">
            No properties on your account yet. Talk to the StayNest team to add one.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.properties.map((p) => (
              <Link
                key={p.id}
                href={`/listings/${p.id}`}
                className="card overflow-hidden group"
              >
                <div className="aspect-[4/3] bg-ink-100">
                  {p.images[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.images[0]}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    {!p.available && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ring-1 bg-ink-100 text-ink-600 ring-ink-200">
                        Unavailable
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-ink-500 flex items-center gap-1">
                    <MapPin size={12} /> {p.location}
                  </div>
                  <div className="text-sm mt-2">
                    <span className="font-semibold">{formatKsh(p.ownerBasePrice)}</span>
                    <span className="text-ink-500"> · your payout / night</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-4">Recent bookings</h2>
        {data.bookings.length === 0 ? (
          <p className="text-sm text-ink-500">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-500">
                <tr className="border-b border-ink-100">
                  <th className="py-3 pr-3 font-semibold">Property</th>
                  <th className="py-3 pr-3 font-semibold">Guest</th>
                  <th className="py-3 pr-3 font-semibold">Dates</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 pr-3 font-semibold text-right">Payout</th>
                  <th className="py-3 pr-0 font-semibold text-right">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {data.bookings.map((b) => {
                  const tone = STATUS_TONE[b.status] ?? STATUS_TONE.pending;
                  const canCancel = CANCELLABLE.has(b.status);
                  return (
                    <tr key={b.id} className="border-b border-ink-100 last:border-0">
                      <td className="py-3 pr-3 font-medium">{propertyName(b.propertyId)}</td>
                      <td className="py-3 pr-3">
                        <div>{b.guestName}</div>
                        <div className="text-xs text-ink-500">{b.guestPhone}</div>
                      </td>
                      <td className="py-3 pr-3 text-ink-600">
                        {b.checkIn} → {b.checkOut}
                        <div className="text-xs text-ink-500">
                          {b.nights} night{b.nights !== 1 ? "s" : ""} · {b.guests} guest{b.guests !== 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ring-1 ${tone}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right font-semibold">
                        {formatKsh(b.ownerPayout)}
                      </td>
                      <td className="py-3 pr-0 text-right">
                        {canCancel && (
                          <button
                            onClick={() => setCancelling(b)}
                            className="text-xs text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                          >
                            <XCircle size={13} /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {cancelling && (
        <CancelBookingModal
          bookingId={cancelling.id}
          propertyName={propertyName(cancelling.propertyId)}
          checkIn={cancelling.checkIn}
          actor="host"
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

function Stat({
  icon, label, value
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-500 font-semibold">
        <span className="text-brand-500">{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}
