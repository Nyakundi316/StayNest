"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getProperties, getOwners, getBookings, getInquiries } from "@/lib/data";
import {
  aggregate,
  formatKsh,
  formatKshCompact,
  clientPriceFor,
  potentialPipeline,
  LISTING_TYPE_LABELS
} from "@/lib/pricing";
import type { Booking, Inquiry, Property, Owner } from "@/lib/types";
import {
  Calendar, Users, Wallet, TrendingUp, Clock, CheckCircle2, Plus, Building2,
  Home, Tag, Key, MessageSquare, Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const reload = useCallback(() => setRefresh((r) => r + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([getProperties(), getOwners(), getBookings(), getInquiries()])
      .then(([p, o, b, i]) => {
        if (!alive) return;
        setProperties(p);
        setOwners(o);
        setBookings(b);
        setInquiries(i);
      })
      .catch((e) => alive && setError(e.message ?? "Failed to load"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [refresh]);

  const handleBookingStatus = async (id: string, status: Booking["status"]) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`/api/booking/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      reload();
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleInquiryStatus = async (id: string, status: Inquiry["status"]) => {
    setBusy((prev) => ({ ...prev, [id]: true }));
    try {
      await fetch(`/api/inquiry/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      reload();
    } finally {
      setBusy((prev) => ({ ...prev, [id]: false }));
    }
  };

  const totals = aggregate(bookings);
  const pipeline = potentialPipeline(properties);
  const propertyById = new Map(properties.map((p) => [p.id, p]));
  const ownerById = new Map(owners.map((o) => [o.id, o]));

  const stayCount = properties.filter((p) => p.listingType === "short_stay").length;
  const saleCount = properties.filter((p) => p.listingType === "sale").length;
  const leaseCount = properties.filter((p) => p.listingType === "lease").length;

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
              Owners &amp; properties
            </Link>
            <Link href="/admin/add-property" className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
              <Plus size={14} /> Add property
            </Link>
          </div>
        </div>

        {error && (
          <div className="card p-4 text-red-600 mb-4">Couldn&apos;t load dashboard: {error}</div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat icon={<Calendar size={18} />} label="Total bookings" value={String(totals.totalBookings)} tone="ink" />
          <Stat icon={<Clock size={18} />} label="Pending" value={String(totals.pending)} tone="amber" />
          <Stat icon={<CheckCircle2 size={18} />} label="Confirmed + done" value={String(totals.confirmed + totals.completed)} tone="green" />
          <Stat icon={<Wallet size={18} />} label="Owner payouts" value={formatKsh(totals.payouts)} tone="ink" />
          <Stat icon={<TrendingUp size={18} />} label="My profit (stays)" value={formatKsh(totals.profit)} tone="brand" />
        </div>

        {/* Portfolio roll-up */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
          <PortfolioCard icon={<Home size={18} />} label="Short stays" count={stayCount}
            value={`${totals.confirmed + totals.completed} bookings`} href="/listings?listingType=short_stay" />
          <PortfolioCard icon={<Tag size={18} />} label="For sale" count={saleCount}
            value={`Potential profit ${formatKshCompact(pipeline.saleProfit)}`} href="/listings?listingType=sale" />
          <PortfolioCard icon={<Key size={18} />} label="For lease" count={leaseCount}
            value={`${formatKsh(pipeline.leaseMonthlyProfit)} / month potential`} href="/listings?listingType=lease" />
        </div>

        {/* Inquiries */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageSquare size={20} className="text-brand-500" />
              Recent inquiries
            </h2>
            <span className="text-sm text-ink-500">{inquiries.length} total</span>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-ink-50 text-ink-500 uppercase text-[11px] tracking-wider">
                  <tr>
                    <Th>Guest</Th>
                    <Th>Property</Th>
                    <Th>Kind</Th>
                    <Th>Details</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((inq) => {
                    const p = propertyById.get(inq.propertyId);
                    const isBusy = Boolean(busy[inq.id]);
                    return (
                      <tr key={inq.id} className="border-t border-ink-100 hover:bg-ink-50/40">
                        <Td>
                          <div className="font-medium text-ink-900">{inq.guestName}</div>
                          <div className="text-xs text-ink-500">{inq.guestPhone}</div>
                        </Td>
                        <Td>{p?.name ?? "—"}</Td>
                        <Td><InquiryKindBadge kind={inq.kind} /></Td>
                        <Td>
                          {inq.kind === "viewing" && inq.preferredDate && (
                            <span className="text-xs text-ink-600">Viewing on {inq.preferredDate}</span>
                          )}
                          {inq.kind === "offer" && (
                            <span className="text-xs text-ink-600">
                              Offer: <span className="font-semibold">{formatKshCompact(inq.offerAmount ?? 0)}</span>
                            </span>
                          )}
                          {inq.kind === "lease_application" && (
                            <span className="text-xs text-ink-600">
                              Move in {inq.moveInDate} &bull; {inq.leaseTermMonths}mo
                            </span>
                          )}
                        </Td>
                        <Td><StatusBadge status={inq.status} /></Td>
                        <Td>
                          {isBusy ? (
                            <Loader2 size={14} className="animate-spin text-ink-400" />
                          ) : (
                            <div className="flex gap-1.5">
                              {inq.status === "new" && (
                                <>
                                  <ActionBtn tone="sky" onClick={() => handleInquiryStatus(inq.id, "contacted")}>
                                    Contacted
                                  </ActionBtn>
                                  <ActionBtn tone="ink" onClick={() => handleInquiryStatus(inq.id, "closed")}>
                                    Close
                                  </ActionBtn>
                                </>
                              )}
                              {inq.status === "contacted" && (
                                <ActionBtn tone="ink" onClick={() => handleInquiryStatus(inq.id, "closed")}>
                                  Close
                                </ActionBtn>
                              )}
                              {inq.status === "closed" && (
                                <span className="text-xs text-ink-400">—</span>
                              )}
                            </div>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                  {!loading && inquiries.length === 0 && (
                    <tr><Td><span className="text-ink-500">No inquiries yet.</span></Td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Bookings */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Stay bookings</h2>
            <span className="text-sm text-ink-500">
              {loading ? "Loading…" : `${bookings.length} total`}
            </span>
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
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const p = propertyById.get(b.propertyId);
                    const isBusy = Boolean(busy[b.id]);
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
                        <Td>
                          <StatusBadge status={b.status} />
                          {b.paymentStatus !== "unpaid" && (
                            <div className="mt-1">
                              <PaymentBadge status={b.paymentStatus} />
                            </div>
                          )}
                        </Td>
                        <Td>
                          {isBusy ? (
                            <Loader2 size={14} className="animate-spin text-ink-400" />
                          ) : (
                            <div className="flex gap-1.5">
                              {b.status === "pending" && (
                                <>
                                  <ActionBtn tone="green" onClick={() => handleBookingStatus(b.id, "confirmed")}>
                                    Confirm
                                  </ActionBtn>
                                  <ActionBtn tone="red" onClick={() => handleBookingStatus(b.id, "cancelled")}>
                                    Cancel
                                  </ActionBtn>
                                </>
                              )}
                              {b.status === "confirmed" && (
                                <>
                                  <ActionBtn tone="green" onClick={() => handleBookingStatus(b.id, "completed")}>
                                    Complete
                                  </ActionBtn>
                                  <ActionBtn tone="red" onClick={() => handleBookingStatus(b.id, "cancelled")}>
                                    Cancel
                                  </ActionBtn>
                                </>
                              )}
                              {(b.status === "completed" || b.status === "cancelled") && (
                                <span className="text-xs text-ink-400">—</span>
                              )}
                            </div>
                          )}
                        </Td>
                      </tr>
                    );
                  })}
                  {!loading && bookings.length === 0 && (
                    <tr><Td><span className="text-ink-500">No bookings yet.</span></Td></tr>
                  )}
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
              const owner = ownerById.get(p.ownerId);
              const { amount } = clientPriceFor(p);
              const ownerNum =
                p.listingType === "sale" ? p.salePrice ?? 0
                : p.listingType === "lease" ? p.monthlyRent ?? 0
                : p.ownerBasePrice ?? 0;
              const markupNum =
                p.listingType === "sale" ? p.saleMarkup ?? 0
                : p.listingType === "lease" ? p.leaseMarkup ?? 0
                : p.markup ?? 0;
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
                  <img src={p.images[0]} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate">{p.name}</div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-ink-100 text-ink-600">
                        {LISTING_TYPE_LABELS[p.listingType]}
                      </span>
                    </div>
                    <div className="text-xs text-ink-500 truncate">{p.location} &bull; {p.type}</div>
                    <div className="text-xs text-ink-500 truncate">
                      Owner: {owner?.name ?? "—"} &bull; {owner?.phone}
                    </div>
                    <div className="grid grid-cols-3 mt-2 gap-1 text-[11px]">
                      <Mini label="Owner" value={p.listingType === "sale" ? formatKshCompact(ownerNum) : formatKsh(ownerNum)} />
                      <Mini label="Markup" value={p.listingType === "sale" ? formatKshCompact(markupNum) : formatKsh(markupNum)} tone="brand" />
                      <Mini label="Client" value={p.listingType === "sale" ? formatKshCompact(amount) : formatKsh(amount)} />
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

// ---- Sub-components ----

function Stat({ icon, label, value, tone }: {
  icon: React.ReactNode; label: string; value: string;
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

function PortfolioCard({ icon, label, count, value, href }: {
  icon: React.ReactNode; label: string; count: number; value: string; href: string;
}) {
  return (
    <Link href={href} className="card p-5 flex items-center justify-between hover:shadow-card transition-shadow">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-ink-500">
          <span className="text-brand-500">{icon}</span>{label}
        </div>
        <div className="mt-2 text-2xl font-bold">{count}</div>
        <div className="text-xs text-ink-500">{value}</div>
      </div>
      <span className="text-brand-500 text-sm">→</span>
    </Link>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function ActionBtn({ children, onClick, tone }: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "green" | "red" | "sky" | "ink";
}) {
  const styles: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    red: "bg-red-100 text-red-700 hover:bg-red-200",
    sky: "bg-sky-100 text-sky-700 hover:bg-sky-200",
    ink: "bg-ink-100 text-ink-600 hover:bg-ink-200"
  };
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${styles[tone]}`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    new: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    completed: "bg-ink-100 text-ink-700",
    contacted: "bg-sky-100 text-sky-800",
    closed: "bg-ink-100 text-ink-700",
    cancelled: "bg-red-100 text-red-700"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${map[status] ?? "bg-ink-100 text-ink-700"}`}>
      {status}
    </span>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    unpaid: "bg-ink-100 text-ink-500",
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700"
  };
  const labels: Record<string, string> = {
    unpaid: "unpaid", pending: "pay pending", paid: "paid", failed: "pay failed"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[status] ?? "bg-ink-100 text-ink-500"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function InquiryKindBadge({ kind }: { kind: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    viewing: { label: "Viewing", cls: "bg-sky-100 text-sky-800" },
    offer: { label: "Offer", cls: "bg-amber-100 text-amber-800" },
    lease_application: { label: "Lease apply", cls: "bg-emerald-100 text-emerald-800" }
  };
  const v = map[kind] ?? { label: kind, cls: "bg-ink-100 text-ink-700" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${v.cls}`}>{v.label}</span>
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
