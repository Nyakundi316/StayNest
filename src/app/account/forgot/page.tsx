"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { guestAuth } from "@/lib/guest-auth";

function ForgotInner() {
  const params = useSearchParams();
  const isAdmin = params.get("as") === "admin";
  const signInPath = isAdmin ? "/admin/login" : "/account/login";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const redirectTo = `${window.location.origin}/account/reset${isAdmin ? "?as=admin" : ""}`;
    const { error: authError } = await guestAuth.auth.resetPasswordForEmail(email.trim(), {
      redirectTo
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    // Don't reveal whether the email exists — always show the same confirmation.
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <MailCheck className="mx-auto mb-3 text-brand-600" size={32} />
          <h1 className="h-display text-2xl mb-2">Check your inbox</h1>
          <p className="text-sm text-ink-600">
            If an account exists for <strong>{email}</strong>, we&rsquo;ve sent a link to
            reset your password. The link expires shortly, so use it soon.
          </p>
          <Link href={signInPath} className="btn-primary inline-flex mt-6 px-5 py-2.5 text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
            StayNest
          </div>
          <h1 className="h-display text-3xl">Reset your password</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            Enter the email on your account and we&rsquo;ll send a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60"
          >
            {loading ? "Sending link…" : "Send reset link"}
          </button>

          <p className="text-sm text-ink-500 text-center mt-4">
            Remembered it?{" "}
            <Link href={signInPath} className="text-brand-600 hover:underline font-medium">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  return (
    <Suspense fallback={null}>
      <ForgotInner />
    </Suspense>
  );
}
