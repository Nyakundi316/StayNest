"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { owners, properties, bookings } from "@/lib/data";
import { formatKsh, clientPricePerNight } from "@/lib/pricing";
import { Phone, Mail, Search, Plus } from "lucide-react";

export default function OwnersPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return owners
      .map((o) => {
        const owned = properties.filter((p) => p.ownerId === o.id);
        const payouts = bookings
          .filter((b) => owned.some((p) => p.id === b.propertyId))
          .reduce((s, b) => s + b.ownerPayout, 0);
        const profit = bookings
          .filter((b) => owned.some((p) => p.id === b.propertyId))
          .reduce((s, b) => s + b.agentProfit, 0);
        return { owner: o, owned, payouts, profit };
      })
      .filter((r) => r.owner.name.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <div className="pt-24 pb-16">
      <div className="container-px">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
              Admin
            </div>
            <h1 className="h-display text-3xl sm:text-4xl">Owners &amp; properties</h1>
            <p className="text-ink-500 mt-1 text-sm">
              Manage every property under your portfolio in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="btn-secondary px-4 py-2 text-sm">
              Dashboard
            </Link>
            <Link href="/admin/add-property" className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
              <Plus size={14} /> Add property
            </Link>
          </div>
        </div>

        <div className="card p-3 flex items-center gap-2 mb-6">
          <Search size={16} className="text-ink-400 ml-2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search owners..."
            className="bg-transparent w-full focus:outline-none text-sm py-2"
          />
        </div>

        <div className="space-y-4">
          {rows.map(({ owner, owned, payouts, profit }) => (
            <div key={owner.id} className="card p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-lg">{owner.name}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Phone size={12} /> {owner.phone}
                    </span>
                    {owner.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} /> {owner.email}
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-700">
                      {owner.payoutMethod ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 lg:w-[28rem]">
                  <Stat label="Properties" value={String(owned.length)} />
                  <Stat label="Payouts" value={formatKsh(payouts)} />
                  <Stat label="My profit" value={formatKsh(profit)} brand />
                </div>
              </div>

              {owned.length > 0 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {owned.map((p) => {
                    const finalPrice = clientPricePerNight(p);
                    return (
                      <div key={p.id} className="rounded-2xl bg-ink-50 p-3 flex gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate text-sm">{p.name}</div>
                          <div className="text-[11px] text-ink-500 truncate">{p.location} • {p.type}</div>
                          <div className="grid grid-cols-3 gap-1 mt-1 text-[10px]">
                            <Mini label="Owner" value={formatKsh(p.ownerBasePrice)} />
                            <Mini label="Markup" value={formatKsh(p.markup)} brand />
                            <Mini label="Client" value={formatKsh(finalPrice)} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, brand = false }: { label: string; value: string; brand?: boolean }) {
  return (
    <div className={`rounded-xl px-3 py-2 ${brand ? "bg-brand-50" : "bg-ink-50"}`}>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-500">{label}</div>
      <div className={`font-semibold ${brand ? "text-brand-700" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}

function Mini({ label, value, brand = false }: { label: string; value: string; brand?: boolean }) {
  return (
    <div className={`rounded px-1.5 py-1 ${brand ? "bg-brand-100" : "bg-white"}`}>
      <div className="text-[9px] uppercase font-semibold text-ink-500">{label}</div>
      <div className={`font-semibold ${brand ? "text-brand-700" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}
