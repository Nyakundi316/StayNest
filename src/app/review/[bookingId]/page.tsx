"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface BookingInfo {
  guestName: string;
  checkOut: string;
  propertyName: string;
  propertyLocation: string;
  alreadyReviewed?: boolean;
}

export default function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  const [info, setInfo] = useState<BookingInfo | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/review/${bookingId}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) { setLoadErr(body.error ?? "Something went wrong"); return; }
        setInfo(body);
        if (body.guestName) setName(body.guestName);
      })
      .catch(() => setLoadErr("Could not load review form"));
  }, [bookingId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setSubmitErr("Please choose a star rating"); return; }
    setSubmitting(true);
    setSubmitErr(null);
    const res = await fetch(`/api/review/${bookingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guestName: name, rating, comment })
    });
    const body = await res.json();
    setSubmitting(false);
    if (!res.ok) { setSubmitErr(body.error ?? "Failed to submit"); return; }
    setDone(true);
  }

  if (loadErr) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-2xl mb-3">🔒</div>
          <p className="font-semibold">{loadErr}</p>
          <p className="text-sm text-ink-500 mt-2">
            This link may have expired or the booking hasn&apos;t been completed yet.
          </p>
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (info.alreadyReviewed || done) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-10 max-w-md w-full text-center"
        >
          <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {done ? "Thanks for your review!" : "Already reviewed"}
          </h1>
          <p className="text-ink-500 text-sm leading-relaxed">
            {done
              ? `Your feedback for ${info.propertyName} has been submitted and helps future guests.`
              : `You've already left a review for ${info.propertyName}. Thank you!`}
          </p>
        </motion.div>
      </div>
    );
  }

  const stars = [1, 2, 3, 4, 5];
  const displayed = hover || rating;

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="card p-8 max-w-lg w-full"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-500 mb-1">Review</p>
          <h1 className="text-2xl font-bold leading-tight">{info.propertyName}</h1>
          <p className="text-sm text-ink-500 mt-0.5">{info.propertyLocation}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="label">Your rating</label>
            <div className="flex gap-1 mt-1">
              {stars.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  className="p-1 transition-transform hover:scale-110"
                  aria-label={`${s} star${s > 1 ? "s" : ""}`}
                >
                  <Star
                    size={30}
                    className={`transition-colors ${
                      s <= displayed
                        ? "fill-brand-400 text-brand-400"
                        : "fill-ink-100 text-ink-100"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-ink-500 mt-1">
                {["", "Poor", "Below average", "Average", "Good", "Excellent"][rating]}
              </p>
            )}
          </div>

          <div>
            <label className="label" htmlFor="rev-name">Your name</label>
            <input
              id="rev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="label" htmlFor="rev-comment">
              Comment <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id="rev-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="input resize-none"
              placeholder="Share what you liked, what could be improved…"
            />
          </div>

          {submitErr && (
            <p className="text-sm text-red-600">{submitErr}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 text-sm"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
