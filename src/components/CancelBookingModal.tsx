"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { guestAuthHeaders } from "@/lib/guest-auth";

const LATE_WINDOW_HOURS = 48;

type Props = {
  bookingId: string;
  propertyName: string;
  checkIn: string;
  actor: "guest" | "host";
  /** When provided, the request is authorized by the signed magic-link
   *  token instead of the Bearer session — used by /booking/[id]/manage. */
  token?: string;
  onClose: () => void;
  onDone: () => void;
};

export default function CancelBookingModal({
  bookingId, propertyName, checkIn, actor, token, onClose, onDone
}: Props) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLate = useMemo(() => {
    const hours = (new Date(checkIn).getTime() - Date.now()) / (1000 * 60 * 60);
    return hours < LATE_WINDOW_HOURS;
  }, [checkIn]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      // Magic-link flow doesn't have a Supabase session; the token in the
      // body is the only credential the server should rely on.
      if (!token) Object.assign(headers, await guestAuthHeaders());

      const res = await fetch(`/api/booking/${bookingId}/cancel`, {
        method: "POST",
        headers,
        body: JSON.stringify(token ? { reason, token } : { reason })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not cancel this booking.");
        return;
      }
      onDone();
    } catch (err: any) {
      setError(err?.message ?? "Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink-900/60 backdrop-blur-sm grid place-items-center px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card max-w-md w-full p-6 relative"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-ink-400 hover:text-ink-700"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${
            isLate ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
          }`}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">Cancel this booking?</h2>
            <p className="text-sm text-ink-500 mt-1">{propertyName} — check-in {checkIn}</p>
          </div>
        </div>

        <div className={`text-sm rounded-2xl px-4 py-3 mb-4 ${
          isLate
            ? "bg-red-50 text-red-700"
            : "bg-emerald-50 text-emerald-700"
        }`}>
          {isLate
            ? "Check-in is within 48 hours — this counts as a late cancellation. A refund is not guaranteed and will be reviewed by our team."
            : "You're cancelling more than 48 hours before check-in — free cancellation. If you've already paid, our team will process the refund manually."}
        </div>

        <label className="label" htmlFor="cancel-reason">
          {actor === "host" ? "Reason for the guest (optional)" : "Reason (optional)"}
        </label>
        <textarea
          id="cancel-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="input"
          placeholder={actor === "host" ? "We'll share this with the guest." : "Let us know what changed."}
        />

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-60 inline-flex items-center gap-1.5"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Cancel booking
          </button>
        </div>
      </div>
    </div>
  );
}
