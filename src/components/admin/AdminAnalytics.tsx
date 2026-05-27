"use client";

import { BarChart3, TrendingUp, Users, PackageSearch } from "lucide-react";
import type { Booking, Inquiry, Property } from "@/lib/types";
import { clientPriceFor, formatKshCompact } from "@/lib/pricing";

interface Props {
  bookings: Booking[];
  inquiries: Inquiry[];
  properties: Property[];
}

function monthKey(value: string) {
  return new Date(value).toISOString().slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01T00:00:00`).toLocaleDateString("en-KE", {
    month: "short",
    year: "2-digit"
  });
}

function lastMonths(count = 6) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return d.toISOString().slice(0, 7);
  });
}

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

export default function AdminAnalytics({ bookings, inquiries, properties }: Props) {
  const months = lastMonths(6);
  const revenue = months.map((m) => ({
    key: m,
    value: bookings
      .filter((b) => monthKey(b.createdAt) === m && b.status !== "cancelled")
      .reduce((sum, b) => sum + b.total, 0)
  }));
  const orderCounts = months.map((m) => ({
    key: m,
    value: bookings.filter((b) => monthKey(b.createdAt) === m).length
  }));

  const propertyBookings = new Map<string, number>();
  for (const booking of bookings) {
    propertyBookings.set(booking.propertyId, (propertyBookings.get(booking.propertyId) ?? 0) + 1);
  }
  const topProducts = [...properties]
    .filter((p) => (propertyBookings.get(p.id) ?? 0) > 0)
    .sort((a, b) => (propertyBookings.get(b.id) ?? 0) - (propertyBookings.get(a.id) ?? 0))
    .slice(0, 5);
  const lowStock = properties.filter((p) => !p.available && !p.archived).slice(0, 5);

  const customerMonths = months.map((m) => {
    const emails = new Set<string>();
    for (const b of bookings) if (monthKey(b.createdAt) === m) emails.add(b.guestEmail.toLowerCase());
    for (const i of inquiries) if (monthKey(i.createdAt) === m) emails.add(i.guestEmail.toLowerCase());
    return { key: m, value: emails.size };
  });

  const nonCancelled = bookings.filter((b) => b.status !== "cancelled").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length;
  const paid = bookings.filter((b) => b.paymentStatus === "paid").length;
  const inquiryClosed = inquiries.filter((i) => i.status === "closed").length;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 size={20} className="text-brand-500" />
          Analytics
        </h2>
        <span className="text-sm text-ink-500">Last 6 months</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Revenue over time" subtitle="Non-cancelled booking totals">
          <BarSeries data={revenue} format={formatKshCompact} />
        </ChartCard>
        <ChartCard title="Orders over time" subtitle="Booking requests created">
          <BarSeries data={orderCounts} format={(n) => String(n)} />
        </ChartCard>
        <ChartCard title="Customer growth" subtitle="Unique booking + inquiry emails">
          <BarSeries data={customerMonths} format={(n) => String(n)} />
        </ChartCard>
        <ChartCard title="Conversion signals" subtitle="Based on current booking and inquiry status">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Metric label="Booking confirm rate" value={`${pct(confirmed, bookings.length)}%`} helper={`${confirmed}/${bookings.length}`} />
            <Metric label="Paid booking rate" value={`${pct(paid, nonCancelled)}%`} helper={`${paid}/${nonCancelled}`} />
            <Metric label="Inquiry close rate" value={`${pct(inquiryClosed, inquiries.length)}%`} helper={`${inquiryClosed}/${inquiries.length}`} />
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ChartCard title="Top listings" subtitle="Ranked by bookings">
          <div className="space-y-3">
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-ink-500">{clientPriceFor(p).unit || "sale"} - {p.city}</div>
                </div>
                <span className="chip shrink-0">{propertyBookings.get(p.id) ?? 0} bookings</span>
              </div>
            ))}
            {topProducts.length === 0 && <Empty label="No listing activity yet." />}
          </div>
        </ChartCard>
        <ChartCard title="Low-stock listings" subtitle="Unavailable but not archived">
          <div className="space-y-3">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-ink-500">{p.location}</div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  <PackageSearch size={12} /> Out
                </span>
              </div>
            ))}
            {lowStock.length === 0 && <Empty label="No unavailable listings." />}
          </div>
        </ChartCard>
      </div>
    </section>
  );
}

function ChartCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="mb-5">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-ink-500 mt-0.5">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function BarSeries({
  data,
  format
}: {
  data: { key: string; value: number }[];
  format: (value: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="h-48 flex items-end gap-2">
      {data.map((d) => {
        const height = Math.max(8, Math.round((d.value / max) * 140));
        return (
          <div key={d.key} className="flex-1 min-w-0 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-36">
              <div
                className="w-full max-w-14 rounded-t-lg bg-brand-500/85"
                style={{ height }}
                title={`${monthLabel(d.key)}: ${format(d.value)}`}
              />
            </div>
            <div className="text-[11px] text-ink-500 truncate">{monthLabel(d.key)}</div>
            <div className="text-[11px] font-semibold text-ink-700 truncate">{format(d.value)}</div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <TrendingUp size={13} className="text-brand-500" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-ink-500">{helper}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 p-5 text-sm text-ink-500 flex items-center gap-2">
      <Users size={15} />
      {label}
    </div>
  );
}
