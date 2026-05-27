"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";

interface RestockNotifyProps {
  propertyId: string;
  propertyName: string;
}

export default function RestockNotify({ propertyId, propertyName }: RestockNotifyProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/restock/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, email: trimmed })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save your request.");
      setSent(true);
    } catch (err: any) {
      setError(err?.message ?? "Could not save your request.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="card p-6 lg:sticky lg:top-24 text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-500 text-white">
          <CheckCircle2 size={24} />
        </div>
        <h2 className="h-display text-xl">You are on the list</h2>
        <p className="mt-2 text-sm text-ink-600">
          We will email you when {propertyName} is available again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 lg:sticky lg:top-24">
      <div className="flex items-center gap-2 text-brand-600">
        <Bell size={18} />
        <span className="text-xs font-semibold uppercase tracking-wider">Unavailable</span>
      </div>
      <h2 className="h-display mt-3 text-2xl">Notify me when available</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-600">
        This listing is currently unavailable. Leave your email and we will let you know when it is back.
      </p>

      <label className="mt-5 block">
        <span className="label">Email address</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="input"
          autoComplete="email"
          required
        />
      </label>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-4 w-full py-3 text-base disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Bell size={16} className="mr-2" />}
        Notify me
      </button>
    </form>
  );
}
