"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { PropertyType } from "@/lib/types";
import { formatKsh } from "@/lib/pricing";

const TYPES: PropertyType[] = ["Studio", "Apartment", "House", "Villa", "Room"];

export default function AddPropertyPage() {
  const [form, setForm] = useState({
    name: "",
    location: "",
    type: "Studio" as PropertyType,
    ownerName: "",
    ownerPhone: "",
    ownerBasePrice: 0,
    markup: 0,
    bedrooms: 1,
    bathrooms: 1,
    guests: 1,
    amenities: "",
    description: "",
    available: true
  });
  const [submitted, setSubmitted] = useState(false);

  const finalPrice = useMemo(() => Number(form.ownerBasePrice) + Number(form.markup), [form]);

  const update = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.ownerName || !form.ownerPhone) {
      alert("Please complete the required fields.");
      return;
    }
    if (form.ownerBasePrice <= 0) {
      alert("Owner base price must be greater than 0.");
      return;
    }
    if (form.markup < 0) {
      alert("Markup cannot be negative.");
      return;
    }
    // In real app: POST to /api/properties -> Supabase insert
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (submitted) {
    return (
      <div className="pt-32 pb-16 container-px max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-10 text-center"
        >
          <div className="w-14 h-14 rounded-full bg-brand-500 grid place-items-center text-white mx-auto mb-4">
            <CheckCircle2 size={28} />
          </div>
          <h1 className="h-display text-3xl mb-2">Property added</h1>
          <p className="text-ink-600">
            <strong>{form.name}</strong> is now under StayNest management. Once you
            wire up Supabase, this form will write directly to the database.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm text-left">
            <Card label="Owner price" value={formatKsh(Number(form.ownerBasePrice))} />
            <Card label="Markup" value={formatKsh(Number(form.markup))} highlight />
            <Card label="Final client price" value={formatKsh(finalPrice)} />
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/admin" className="btn-secondary px-5 py-2.5 text-sm">
              Back to dashboard
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  name: "", location: "", type: "Studio", ownerName: "", ownerPhone: "",
                  ownerBasePrice: 0, markup: 0, bedrooms: 1, bathrooms: 1, guests: 1,
                  amenities: "", description: "", available: true
                });
              }}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Add another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container-px max-w-4xl">
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">Admin only</div>
          <h1 className="h-display text-3xl sm:text-4xl">Add a new property</h1>
          <p className="text-ink-500 mt-1 text-sm">
            Owner price + your markup = final price the client sees.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-6">
          <div className="space-y-6">
            <Section title="Property basics">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Property name *" value={form.name} onChange={(v) => update("name", v)} placeholder="Sunlit Studio in Kilimani" />
                <Field label="Location *" value={form.location} onChange={(v) => update("location", v)} placeholder="Kilimani, Nairobi" />
                <Select label="Type" value={form.type} onChange={(v) => update("type", v as PropertyType)} options={TYPES} />
                <div className="grid grid-cols-3 gap-2">
                  <NumField label="Beds" value={form.bedrooms} onChange={(v) => update("bedrooms", v)} />
                  <NumField label="Baths" value={form.bathrooms} onChange={(v) => update("bathrooms", v)} />
                  <NumField label="Guests" value={form.guests} onChange={(v) => update("guests", v)} />
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  className="input"
                  placeholder="What makes this stay special?"
                />
              </div>
            </Section>

            <Section title="Owner">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Owner name *" value={form.ownerName} onChange={(v) => update("ownerName", v)} placeholder="Wanjiru Kamau" />
                <Field label="Owner phone *" value={form.ownerPhone} onChange={(v) => update("ownerPhone", v)} placeholder="+254 700 000 000" />
              </div>
            </Section>

            <Section title="Pricing">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <NumField label="Owner base price (KSH) *" value={form.ownerBasePrice} onChange={(v) => update("ownerBasePrice", v)} step={500} />
                <NumField label="Markup (KSH) *" value={form.markup} onChange={(v) => update("markup", v)} step={100} />
                <div>
                  <label className="label">Final client price</label>
                  <div className="input bg-ink-50 font-semibold">
                    {formatKsh(finalPrice)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-ink-500 mt-2">
                💡 Clients only see the final price. Owner price and markup are kept internal.
              </p>
            </Section>

            <Section title="Amenities & images">
              <Field
                label="Amenities (comma separated)"
                value={form.amenities}
                onChange={(v) => update("amenities", v)}
                placeholder="Wi-Fi, Parking, Hot Shower"
              />
              <div className="mt-3">
                <label className="label">Images</label>
                <div className="border-2 border-dashed border-ink-200 rounded-2xl p-8 text-center text-ink-500 bg-ink-50/40">
                  <ImageIcon className="mx-auto mb-2" />
                  <div className="text-sm">Drag &amp; drop images here, or click to upload</div>
                  <div className="text-xs mt-1">(Image upload will be wired to Supabase Storage)</div>
                </div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.available}
                  onChange={(e) => update("available", e.target.checked)}
                  className="h-4 w-4 rounded text-brand-500 focus:ring-brand-400"
                />
                Currently available for booking
              </label>
            </Section>

            <button type="submit" className="btn-primary w-full py-3.5">
              Save property
            </button>
          </div>

          {/* Sticky preview */}
          <aside className="card p-5 lg:sticky lg:top-24 h-fit">
            <h3 className="font-semibold mb-3">Live preview</h3>
            <div className="rounded-2xl overflow-hidden bg-ink-50 aspect-[4/3] grid place-items-center text-ink-400">
              <ImageIcon size={32} />
            </div>
            <div className="mt-3">
              <div className="font-semibold truncate">{form.name || "Property name"}</div>
              <div className="text-xs text-ink-500 truncate">{form.location || "Location"}</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <Mini label="Owner" value={formatKsh(Number(form.ownerBasePrice) || 0)} />
              <Mini label="Markup" value={formatKsh(Number(form.markup) || 0)} brand />
              <Mini label="Client" value={formatKsh(finalPrice)} />
            </div>
            <div className="mt-3 text-xs text-ink-500">
              Profit per night: <span className="font-semibold text-brand-600">{formatKsh(Number(form.markup) || 0)}</span>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        placeholder={placeholder}
      />
    </label>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="input"
      />
    </label>
  );
}

function Select<T extends string>({
  label,
  value,
  onChange,
  options
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: T[];
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="input"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Mini({ label, value, brand = false }: { label: string; value: string; brand?: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${brand ? "bg-brand-50" : "bg-ink-50"}`}>
      <div className="text-[10px] uppercase font-semibold tracking-wider text-ink-500">{label}</div>
      <div className={`text-xs font-semibold ${brand ? "text-brand-700" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}

function Card({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${highlight ? "bg-brand-50" : "bg-ink-50"}`}>
      <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</div>
      <div className={`font-semibold mt-0.5 ${highlight ? "text-brand-700" : "text-ink-900"}`}>{value}</div>
    </div>
  );
}
