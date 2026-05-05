"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { bookings, properties, owners, getProperty, getOwner } from "@/lib/data";
import { aggregate, formatKsh, clientPricePerNight } from "@/lib/pricing";
import {
  Calendar,
  Users,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Building2
} from "lucide-react";

export default function AdminDashboard() {
  const totals = aggregate(bookings);

  return (
    <div className="pt-24 pb-16">
      <div className="container-px">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              Agent dashboard
            </div>
            <h1 className="h-display text-3xl sm:text-4xl">StayNest control room</h1>
            <p className="text-ink-500 mt-1 text-sm">
              Owner prices, markups and profit are visible only here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/owners" className="btn-secondary px-4 py-2 text-sm">
              Owners & properties
            </Link>
            <Link href="/admin/add-property" className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
              <Plus size={14} /> Add property
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat
            icon={<Calendar size={18} />}
            label="Total bookings"
            value={String(totals.totalBookings)}
            tone="ink"
          />
          <Stat
            icon={<Clock size={18} />}
            label="Pending"
            value={String(totals.pending)}
            tone="amber"
          />
          <Stat
            icon={<CheckCircle2 size={18} />}
            label="Confirmed + completed"
            value={String(totals.confirmed + totals.completed)}
            tone="green"
          />
          <Stat
            icon={<Wallet size={18} />}
            label="Owner payouts"
            value={formatKsh(totals.payouts)}
            tone="ink"
          />
          <Stat
            icon={<TrendingUp size={18} />}
            label="My profit"
            value={formatKsh(totals.profit)}
            tone="brand"
          />
        </div>

        {/* Bookings table */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent bookings</h2>
            <span className="text-sm text-ink-500">{bookings.length} total</span>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-ink-50 text-ink-500 uppercase text-[11px] tracking-wider">
                  <tr>
                    <Th>Guest</Th>
                    <Th>Property</Th>
                    <Th>Dates</Th>
                    <Th>Nights</Th>
                    <Th>Client total</Th>
                    <Th>Owner payout</Th>
                    <Th>My profit</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const p = getProperty(b.propertyId);
                    return (
                      <tr key={b.id} className="border-t border-ink-100 hover:bg-ink-50/40">
                        <Td>
                          <div className="font-medium text-ink-900">{b.guestName}</div>
                          <div className="text-xs text-ink-500">{b.guestPhone}</div>
                        </Td>
                        <Td>{p?.name ?? "—"}</Td>
                        <Td>
                          <div>{b.checkIn}</div>
                          <div className="text-xs text-ink-500">→ {b.checkOut}</div>
                        </Td>
                        <Td>{b.nights}</Td>
                        <Td className="font-medium">{formatKsh(b.total)}</Td>
                        <Td className="text-ink-700">{formatKsh(b.ownerPayout)}</Td>
                        <Td className="text-brand-600 font-semibold">{formatKsh(b.agentProfit)}</Td>
                        <Td><StatusBadge status={b.status} /></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Properties */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Building2 size={20} className="text-brand-500" />
              Properties under management
            </h2>
            <span className="text-sm text-ink-500">{properties.length} listed</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p, i) => {
              const owner = getOwner(p.ownerId);
              const finalPrice = clientPricePerNight(p);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                  className="card p-4 flex gap-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0]}
                    alt=""
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-ink-500 truncate">{p.location} • {p.type}</div>
                    <div className="text-xs text-ink-500 truncate">
                      Owner: {owner?.name ?? "—"} • {owner?.phone}
                    </div>
                    <div className="grid grid-cols-3 mt-2 gap-1 text-[11px]">
                      <Mini label="Owner" value={formatKsh(p.ownerBasePrice)} />
                      <Mini label="Markup" value={formatKsh(p.markup)} tone="brand" />
                      <Mini label="Client" value={formatKsh(finalPrice)} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Owners */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users size={20} className="text-brand-500" />
              Property owners
            </h2>
            <Link href="/admin/owners" className="text-sm text-brand-600 hover:underline">Manage owners →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {owners.map((o) => {
              const owned = properties.filter((p) => p.ownerId === o.id);
              const payouts = bookings
                .filter((b) => owned.some((p) => p.id === b.propertyId))
                .reduce((s, b) => s + b.ownerPayout, 0);
              return (
                <div key={o.id} className="card p-4">
                  <div className="font-semibold">{o.name}</div>
                  <div className="text-xs text-ink-500 mt-0.5">{o.phone}</div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <Mini label="Properties" value={String(owned.length)} />
                    <Mini label="Payouts" value={formatKsh(payouts)} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "ink" | "amber" | "green" | "brand";
}) {
  const tones: Record<string, string> = {
    ink: "bg-white border-ink-100",
    amber: "bg-amber-50 border-amber-100",
    green: "bg-emerald-50 border-emerald-100",
    brand: "bg-brand-50 border-brand-100"
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-ink-500">
        <span className="text-brand-500">{icon}</span>
        <span className="text-xs uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="mt-2 text-xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-ink-100 text-ink-700",
    cancelled: "bg-red-100 text-red-700"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${map[status] ?? "bg-ink-100 text-ink-700"}`}>
      {status}
    </span>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${tone === "brand" ? "bg-brand-50" : "bg-ink-50"}`}>
      <div className="text-[10px] uppercase font-semibold tracking-wider text-ink-500">{label}</div>
      <div className={`text-xs font-semibold ${tone === "brand" ? "text-brand-700" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}
