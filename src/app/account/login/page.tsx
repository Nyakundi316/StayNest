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

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await guestAuth.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace(next);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
            StayNest
          </div>
          <h1 className="h-display text-3xl">Welcome back</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            Sign in to see your bookings and reviews.
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

          <div>
            <label className="label" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
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
            <p className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-sm text-ink-500 text-center mt-4">
            New here?{" "}
            <Link
              href={`/account/signup${next !== "/account/bookings" ? `?next=${encodeURIComponent(next)}` : ""}`}
              className="text-brand-600 hover:underline font-medium"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function AccountLogin() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
