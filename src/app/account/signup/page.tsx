"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { guestAuth } from "@/lib/guest-auth";

function safeNext(value: string | null): string {
  if (!value) return "/account/bookings";
  if (!value.startsWith("/")) return "/account/bookings";
  if (value.startsWith("//")) return "/account/bookings";
  if (value.startsWith("/admin")) return "/account/bookings";
  return value;
}

function SignupInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading(true);

    const { data, error: authError } = await guestAuth.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim()
        }
      }
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    // Email confirmation may be required depending on the Supabase project config.
    if (data.session) {
      router.replace(next);
    } else {
      setNeedsConfirm(true);
    }
  };

  if (needsConfirm) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="h-display text-2xl mb-2">Check your inbox</h1>
          <p className="text-sm text-ink-600">
            We sent a confirmation link to <strong>{email}</strong>. Click it to
            activate your account, then come back and sign in.
          </p>
          <Link href="/account/login" className="btn-primary inline-flex mt-6 px-5 py-2.5 text-sm">
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
          <h1 className="h-display text-3xl">Create an account</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            Track bookings, save favourites, leave reviews.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="full-name">Full name</label>
            <input
              id="full-name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Jane Mwangi"
            />
          </div>

          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="0712 345 678"
            />
          </div>

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

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

          <p className="text-sm text-ink-500 text-center mt-4">
            Already have an account?{" "}
            <Link
              href={`/account/login${next !== "/account/bookings" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-brand-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AccountSignup() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}
