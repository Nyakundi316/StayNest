"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      alert("Please fill in your name, email and message.");
      return;
    }
    // In real app: POST to /api/contact -> Supabase / email service
    setSent(true);
  };

  return (
    <div className="pt-24 pb-16">
      <section className="container-px max-w-3xl text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-3">
          Contact
        </div>
        <h1 className="h-display text-4xl sm:text-5xl">We&apos;d love to hear from you.</h1>
        <p className="mt-3 text-ink-600">
          Questions about a listing, hosting or your booking? Drop us a line.
        </p>
      </section>

      <section className="container-px mt-12 grid lg:grid-cols-[1fr_22rem] gap-8 max-w-5xl mx-auto">
        <div className="card p-6 sm:p-8">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-10"
            >
              <div className="w-14 h-14 rounded-full bg-brand-500 grid place-items-center text-white mx-auto mb-4">
                <CheckCircle2 size={28} />
              </div>
              <div className="h-display text-2xl mb-1">Thanks, {form.name.split(" ")[0]}!</div>
              <p className="text-ink-600">We&apos;ll get back to you within a few hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <div className="sm:col-span-2">
                <Field label="Subject" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Message</label>
                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input"
                  placeholder="How can we help?"
                />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" className="btn-primary px-6 py-3 text-base flex items-center gap-2">
                  <Send size={16} /> Send message
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-3">
          <Info icon={<Phone size={16} />} label="Phone" value="+254 700 000 000" />
          <Info icon={<Mail size={16} />} label="Email" value="hello@staynest.co.ke" />
          <Info icon={<MapPin size={16} />} label="Office" value="Nairobi, Kenya" />
          <div className="card overflow-hidden">
            <div className="aspect-[4/3] bg-ink-50 grid place-items-center text-ink-400 text-sm">
              Map placeholder
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
        required
      />
    </label>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl grid place-items-center bg-brand-500 text-white">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wider font-semibold text-ink-500">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
