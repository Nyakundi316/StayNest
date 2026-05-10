"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Phone, Mail, User } from "lucide-react";
import { Property } from "@/lib/types";
import {
  clientSalePrice,
  clientMonthlyRent,
  formatKsh,
  formatKshCompact
} from "@/lib/pricing";

interface Props {
  property: Property;
}

export default function InquiryCard({ property }: Props) {
  const isSale = property.listingType === "sale";
  const isLease = property.listingType === "lease";

  const [tab, setTab] = useState<"viewing" | "offer" | "lease_application">(
    isLease ? "lease_application" : "viewing"
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    preferredDate: "",
    offerAmount: 0,
    moveInDate: "",
    leaseTermMonths: property.leaseTermMonths ?? 12,
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headlineAmount = isSale
    ? clientSalePrice(property)
    : isLease
      ? clientMonthlyRent(property)
      : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill in your name, email and phone.");
      return;
    }
    if (tab === "offer" && form.offerAmount <= 0) {
      setError("Please enter your offer amount.");
      return;
    }
    if (tab === "lease_application" && !form.moveInDate) {
      setError("Please choose a move-in date.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/inquiry/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          kind: tab,
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone,
          preferredDate: form.preferredDate || null,
          offerAmount: tab === "offer" ? Number(form.offerAmount) : null,
          moveInDate: tab === "lease_application" ? form.moveInDate : null,
          leaseTermMonths: tab === "lease_application" ? Number(form.leaseTermMonths) : null,
          message: form.message || null
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't send your request.");
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 lg:sticky lg:top-24 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-brand-500 grid place-items-center text-white mx-auto mb-3">
          <CheckCircle2 size={24} />
        </div>
        <div className="h-display text-xl mb-1">Sent!</div>
        <p className="text-sm text-ink-600">
          We&apos;ve received your{" "}
          {tab === "viewing" ? "viewing request" : tab === "offer" ? "offer" : "lease application"}.
          Our team will reach out within an hour.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="card p-6 lg:sticky lg:top-24">
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="text-2xl font-semibold">
            {isSale ? formatKshCompact(headlineAmount) : formatKsh(headlineAmount)}
          </div>
          <div className="text-sm text-ink-500">
            {isSale ? "Asking price" : "Monthly rent"}
          </div>
        </div>
      </div>

      {/* Tab picker — different actions for sale vs lease */}
      <div className="flex gap-1 p-1 bg-ink-100 rounded-2xl mb-4">
        {isSale && (
          <>
            <Tab active={tab === "viewing"} onClick={() => setTab("viewing")}>Schedule viewing</Tab>
            <Tab active={tab === "offer"} onClick={() => setTab("offer")}>Make an offer</Tab>
          </>
        )}
        {isLease && (
          <>
            <Tab active={tab === "viewing"} onClick={() => setTab("viewing")}>Schedule viewing</Tab>
            <Tab active={tab === "lease_application"} onClick={() => setTab("lease_application")}>Apply</Tab>
          </>
        )}
      </div>

      <form onSubmit={submit} className="space-y-2">
        <FieldIcon icon={<User size={14} />} placeholder="Full name"
          value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <FieldIcon icon={<Mail size={14} />} placeholder="Email" type="email"
          value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <FieldIcon icon={<Phone size={14} />} placeholder="Phone"
          value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />

        {tab === "viewing" && (
          <FieldIcon
            icon={<Calendar size={14} />}
            type="date"
            placeholder="Preferred date"
            value={form.preferredDate}
            onChange={(v) => setForm({ ...form, preferredDate: v })}
          />
        )}
        {tab === "offer" && (
          <label className="block px-3 py-2.5 rounded-2xl border border-ink-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              Your offer (KSH)
            </span>
            <input
              type="number"
              min={0}
              step={100000}
              value={form.offerAmount || ""}
              onChange={(e) =>
                setForm({ ...form, offerAmount: Number(e.target.value) || 0 })
              }
              className="w-full bg-transparent focus:outline-none text-sm"
              placeholder="e.g. 28,000,000"
            />
          </label>
        )}
        {tab === "lease_application" && (
          <>
            <FieldIcon
              icon={<Calendar size={14} />}
              type="date"
              placeholder="Move-in date"
              value={form.moveInDate}
              onChange={(v) => setForm({ ...form, moveInDate: v })}
            />
            <label className="block px-3 py-2.5 rounded-2xl border border-ink-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                Lease term (months)
              </span>
              <input
                type="number"
                min={1}
                max={60}
                value={form.leaseTermMonths}
                onChange={(e) =>
                  setForm({ ...form, leaseTermMonths: Number(e.target.value) || 1 })
                }
                className="w-full bg-transparent focus:outline-none text-sm"
              />
            </label>
          </>
        )}

        <textarea
          rows={2}
          placeholder="Anything else?"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="input"
        />

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3 text-base disabled:opacity-60"
        >
          {submitting
            ? "Sending..."
            : tab === "viewing"
              ? "Request viewing"
              : tab === "offer"
                ? "Submit offer"
                : "Apply to lease"}
        </button>
      </form>

      <p className="mt-2 text-center text-xs text-ink-500">
        No fees to send a request.
      </p>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? "bg-white text-ink-900 shadow-soft" : "text-ink-600 hover:text-ink-900"
      }`}
    >
      {children}
    </button>
  );
}

function FieldIcon({
  icon,
  placeholder,
  value,
  onChange,
  type = "text"
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border border-ink-200 hover:border-ink-300 transition-colors">
      <span className="text-brand-500 shrink-0">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent focus:outline-none text-sm"
      />
    </label>
  );
}
