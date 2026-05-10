"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ImageIcon, Loader2, Plus, X } from "lucide-react";
import { ListingType, PropertyType } from "@/lib/types";
import { formatKsh, formatKshCompact } from "@/lib/pricing";
import { upsertOwner, createProperty } from "@/lib/data";

const TYPES: PropertyType[] = ["Studio", "Apartment", "House", "Villa", "Room"];
const LISTING_TYPES: { value: ListingType; label: string; hint: string }[] = [
  { value: "short_stay", label: "Short stay", hint: "Per-night pricing, with bookings" },
  { value: "sale",       label: "For sale",   hint: "One-time price, with offers" },
  { value: "lease",      label: "For lease",  hint: "Monthly rent, with applications" }
];

const EMPTY_FORM = {
  listingType: "short_stay" as ListingType,
  name: "", location: "", city: "", type: "Studio" as PropertyType,
  ownerName: "", ownerPhone: "", ownerEmail: "",
  ownerPayoutMethod: "M-Pesa" as "M-Pesa" | "Bank" | "Cash",
  ownerBasePrice: 0, markup: 0,
  salePrice: 0, saleMarkup: 0,
  monthlyRent: 0, leaseMarkup: 0, leaseTermMonths: 12,
  bedrooms: 1, bathrooms: 1, guests: 1,
  amenities: "", rules: "", description: "", available: true
};

export default function AddPropertyPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const update = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const finalPrice = useMemo(() => {
    if (form.listingType === "sale") return Number(form.salePrice) + Number(form.saleMarkup);
    if (form.listingType === "lease") return Number(form.monthlyRent) + Number(form.leaseMarkup);
    return Number(form.ownerBasePrice) + Number(form.markup);
  }, [form]);

  const profit = useMemo(() => {
    if (form.listingType === "sale") return Number(form.saleMarkup);
    if (form.listingType === "lease") return Number(form.leaseMarkup);
    return Number(form.markup);
  }, [form]);

  // ---- Image upload ----

  const uploadFiles = useCallback(async (files: File[]) => {
    const valid = files
      .filter((f) => f.type.startsWith("image/") && f.size <= 5 * 1024 * 1024)
      .slice(0, 10);
    if (!valid.length) return;
    setUploading(true);
    await Promise.all(
      valid.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (json.url) setImages((prev) => [...prev, json.url]);
      })
    );
    setUploading(false);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const addUrlManually = () => {
    const urls = urlInput.split(",").map((s) => s.trim()).filter((s) => s.startsWith("http"));
    if (urls.length) setImages((prev) => [...prev, ...urls]);
    setUrlInput("");
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, j) => j !== i));

  // ---- Submit ----

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.location || !form.ownerName || !form.ownerPhone) {
      setError("Please complete all required fields.");
      return;
    }
    if (form.listingType === "short_stay" && Number(form.ownerBasePrice) <= 0) {
      setError("Owner base price must be greater than 0.");
      return;
    }
    if (form.listingType === "sale" && Number(form.salePrice) <= 0) {
      setError("Owner sale price must be greater than 0.");
      return;
    }
    if (form.listingType === "lease" && Number(form.monthlyRent) <= 0) {
      setError("Owner monthly rent must be greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const owner = await upsertOwner({
        name: form.ownerName,
        phone: form.ownerPhone,
        email: form.ownerEmail || undefined,
        payoutMethod: form.ownerPayoutMethod
      });

      const city = form.city || form.location.split(",").pop()?.trim() || form.location;

      await createProperty({
        name: form.name,
        location: form.location,
        city,
        type: form.type,
        listingType: form.listingType,
        description: form.description,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        guests: form.listingType === "short_stay" ? form.guests : 0,
        ownerBasePrice: form.listingType === "short_stay" ? Number(form.ownerBasePrice) : undefined,
        markup: form.listingType === "short_stay" ? Number(form.markup) : undefined,
        salePrice: form.listingType === "sale" ? Number(form.salePrice) : undefined,
        saleMarkup: form.listingType === "sale" ? Number(form.saleMarkup) : undefined,
        monthlyRent: form.listingType === "lease" ? Number(form.monthlyRent) : undefined,
        leaseMarkup: form.listingType === "lease" ? Number(form.leaseMarkup) : undefined,
        leaseTermMonths: form.listingType === "lease" ? Number(form.leaseTermMonths) : undefined,
        amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
        rules: form.rules.split(",").map((s) => s.trim()).filter(Boolean),
        images,
        available: form.available,
        ownerId: owner.id
      });

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err?.message ?? "Failed to save property.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Success screen ----

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
            <strong>{form.name}</strong> is now live with {images.length} image{images.length !== 1 ? "s" : ""}.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-3 text-sm text-left">
            <Card label="Owner price" value={
              form.listingType === "sale" ? formatKshCompact(form.salePrice || 0)
              : form.listingType === "lease" ? `${formatKsh(form.monthlyRent || 0)} / mo`
              : `${formatKsh(form.ownerBasePrice || 0)} / night`
            } />
            <Card label="Markup" value={
              form.listingType === "sale" ? formatKshCompact(profit)
              : `${formatKsh(profit)}${form.listingType === "lease" ? " / mo" : " / night"}`
            } highlight />
            <Card label="Client price" value={
              form.listingType === "sale" ? formatKshCompact(finalPrice)
              : `${formatKsh(finalPrice)}${form.listingType === "lease" ? " / mo" : " / night"}`
            } />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/admin" className="btn-secondary px-5 py-2.5 text-sm">Back to dashboard</Link>
            <Link href={`/listings?listingType=${form.listingType}`} className="btn-secondary px-5 py-2.5 text-sm">View listings</Link>
            <button
              onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); setImages([]); }}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              Add another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isStay = form.listingType === "short_stay";
  const isSale = form.listingType === "sale";
  const isLease = form.listingType === "lease";

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

            {/* Listing type */}
            <Section title="Listing type">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {LISTING_TYPES.map((lt) => {
                  const active = form.listingType === lt.value;
                  return (
                    <button
                      key={lt.value}
                      type="button"
                      onClick={() => update("listingType", lt.value)}
                      className={`text-left p-4 rounded-2xl border transition-colors ${
                        active ? "border-brand-500 bg-brand-50" : "border-ink-200 hover:border-ink-300"
                      }`}
                    >
                      <div className="font-semibold text-sm">{lt.label}</div>
                      <div className="text-xs text-ink-500 mt-1">{lt.hint}</div>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Basics */}
            <Section title="Property basics">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Property name *" value={form.name} onChange={(v) => update("name", v)}
                  placeholder={isSale ? "Modern 4BR Townhouse — Lavington" : "Sunlit Studio in Kilimani"} />
                <Field label="Location *" value={form.location} onChange={(v) => update("location", v)}
                  placeholder="Kilimani, Nairobi" />
                <Field label="City" value={form.city} onChange={(v) => update("city", v)}
                  placeholder="Nairobi (auto if blank)" />
                <Select label="Property type" value={form.type}
                  onChange={(v) => update("type", v as PropertyType)} options={TYPES} />
                <div className={`grid ${isStay ? "grid-cols-3" : "grid-cols-2"} gap-2 sm:col-span-2`}>
                  <NumField label="Beds" value={form.bedrooms} onChange={(v) => update("bedrooms", v)} />
                  <NumField label="Baths" value={form.bathrooms} onChange={(v) => update("bathrooms", v)} />
                  {isStay && <NumField label="Guests" value={form.guests} onChange={(v) => update("guests", v)} />}
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                  rows={4} className="input" placeholder="What makes this property special?" />
              </div>
            </Section>

            {/* Owner */}
            <Section title="Owner">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Owner name *" value={form.ownerName} onChange={(v) => update("ownerName", v)}
                  placeholder="Wanjiru Kamau" />
                <Field label="Owner phone *" value={form.ownerPhone} onChange={(v) => update("ownerPhone", v)}
                  placeholder="+254 700 000 000" />
                <Field label="Owner email" value={form.ownerEmail} onChange={(v) => update("ownerEmail", v)}
                  placeholder="optional" />
                <Select label="Payout method" value={form.ownerPayoutMethod}
                  onChange={(v) => update("ownerPayoutMethod", v)} options={["M-Pesa", "Bank", "Cash"]} />
              </div>
              <p className="text-xs text-ink-500 mt-2">
                If we already have an owner with this phone number, the property is attached to them.
              </p>
            </Section>

            {/* Pricing */}
            <Section title="Pricing">
              {isStay && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <NumField label="Owner price / night (KSH) *" value={form.ownerBasePrice}
                    onChange={(v) => update("ownerBasePrice", v)} step={500} />
                  <NumField label="Markup / night (KSH) *" value={form.markup}
                    onChange={(v) => update("markup", v)} step={100} />
                  <PreviewField label="Client price / night" value={formatKsh(finalPrice)} />
                </div>
              )}
              {isSale && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <NumField label="Owner asking price (KSH) *" value={form.salePrice}
                    onChange={(v) => update("salePrice", v)} step={100000} />
                  <NumField label="Sale markup (KSH) *" value={form.saleMarkup}
                    onChange={(v) => update("saleMarkup", v)} step={50000} />
                  <PreviewField label="Client sale price" value={formatKshCompact(finalPrice)} />
                </div>
              )}
              {isLease && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <NumField label="Owner monthly rent (KSH) *" value={form.monthlyRent}
                    onChange={(v) => update("monthlyRent", v)} step={1000} />
                  <NumField label="Lease markup / month (KSH) *" value={form.leaseMarkup}
                    onChange={(v) => update("leaseMarkup", v)} step={500} />
                  <NumField label="Lease term (months)" value={form.leaseTermMonths}
                    onChange={(v) => update("leaseTermMonths", v)} />
                  <PreviewField label="Client monthly rent" value={`${formatKsh(finalPrice)} / mo`} />
                </div>
              )}
              <p className="text-xs text-ink-500 mt-2">
                Clients only see the final price. Owner price and markup are internal.
              </p>
            </Section>

            {/* Amenities, rules & images */}
            <Section title="Amenities, rules &amp; images">
              <Field label="Amenities (comma separated)" value={form.amenities}
                onChange={(v) => update("amenities", v)}
                placeholder={isStay ? "Wi-Fi, Parking, Hot Shower" : isSale ? "Title Deed, Borehole, Garden" : "Furnished, Lift, Backup Power"} />
              <div className="mt-3">
                <Field label="House rules / lease terms (comma separated)" value={form.rules}
                  onChange={(v) => update("rules", v)}
                  placeholder={isLease ? "12-month minimum, Two months deposit" : "No smoking, No parties"} />
              </div>

              {/* Upload zone */}
              <div className="mt-4">
                <label className="label">Photos</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  onClick={() => !uploading && fileRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? "border-brand-400 bg-brand-50"
                      : "border-ink-200 hover:border-ink-300 bg-ink-50/40"
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-ink-500">
                      <Loader2 size={24} className="animate-spin text-brand-500" />
                      <span className="text-sm">Uploading…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-ink-500">
                      <ImageIcon size={24} className="text-ink-400" />
                      <div>
                        <span className="text-sm font-medium text-ink-700">Click to upload</span>
                        <span className="text-sm text-ink-500"> or drag &amp; drop</span>
                      </div>
                      <span className="text-xs text-ink-400">JPEG, PNG, WebP, GIF · max 5 MB each</span>
                    </div>
                  )}
                </div>

                {/* Thumbnail grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                    {images.map((url, i) => (
                      <div key={i} className="relative aspect-square group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded-md leading-none">
                            Cover
                          </span>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-ink-200 rounded-xl grid place-items-center text-ink-400 hover:border-ink-300 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                )}

                {/* URL fallback */}
                <div className="mt-3">
                  <label className="label text-ink-400 text-xs">Or add from URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrlManually())}
                      className="input text-sm flex-1"
                      placeholder="https://images.unsplash.com/…"
                    />
                    <button
                      type="button"
                      onClick={addUrlManually}
                      className="btn-secondary px-4 text-sm shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.available}
                  onChange={(e) => update("available", e.target.checked)}
                  className="h-4 w-4 rounded text-brand-500 focus:ring-brand-400" />
                Currently available
              </label>
            </Section>

            {error && (
              <div className="card p-4 text-sm text-red-600 border-red-200 bg-red-50">{error}</div>
            )}

            <button
              type="submit"
              disabled={submitting || uploading}
              className="btn-primary w-full py-3.5 disabled:opacity-60"
            >
              {submitting ? "Saving…" : uploading ? "Waiting for uploads…" : "Save property"}
            </button>
          </div>

          {/* Live preview sidebar */}
          <aside className="card p-5 lg:sticky lg:top-24 h-fit">
            <h3 className="font-semibold mb-3">Live preview</h3>
            <div className="rounded-2xl overflow-hidden bg-ink-50 aspect-[4/3] grid place-items-center text-ink-400">
              {images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={32} />
              )}
            </div>
            <div className="mt-3">
              <div className="text-[10px] uppercase font-semibold tracking-wider text-brand-600 mb-1">
                {LISTING_TYPES.find((l) => l.value === form.listingType)?.label}
              </div>
              <div className="font-semibold truncate">{form.name || "Property name"}</div>
              <div className="text-xs text-ink-500 truncate">{form.location || "Location"}</div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <Mini label="Owner"
                value={isSale ? formatKshCompact(Number(form.salePrice) || 0)
                  : isLease ? formatKsh(Number(form.monthlyRent) || 0)
                  : formatKsh(Number(form.ownerBasePrice) || 0)} />
              <Mini label="Markup"
                value={isSale ? formatKshCompact(Number(form.saleMarkup) || 0)
                  : isLease ? formatKsh(Number(form.leaseMarkup) || 0)
                  : formatKsh(Number(form.markup) || 0)}
                brand />
              <Mini label="Client"
                value={isSale ? formatKshCompact(finalPrice) : formatKsh(finalPrice)} />
            </div>
            <div className="mt-3 text-xs text-ink-500">
              Profit{isStay ? " per night" : isLease ? " per month" : " on sale"}:{" "}
              <span className="font-semibold text-brand-600">
                {isSale ? formatKshCompact(profit) : formatKsh(profit)}
              </span>
            </div>
            {images.length > 0 && (
              <div className="mt-3 text-xs text-ink-500">
                {images.length} image{images.length !== 1 ? "s" : ""} ready
              </div>
            )}
          </aside>
        </form>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="input" placeholder={placeholder} />
    </label>
  );
}

function NumField({ label, value, onChange, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input type="number" min={0} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)} className="input" />
    </label>
  );
}

function Select<T extends string>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: T) => void; options: T[];
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T)} className="input">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="input bg-ink-50 font-semibold">{value}</div>
    </div>
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
