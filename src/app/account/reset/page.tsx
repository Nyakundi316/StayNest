"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { guestAuth } from "@/lib/guest-auth";

type Phase = "checking" | "ready" | "invalid" | "done";

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const isAdmin = params.get("as") === "admin";
  const signInPath = isAdmin ? "/admin/login" : "/account/login";

  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The Supabase client reads the recovery token from the URL hash on load and
  // emits PASSWORD_RECOVERY once it has exchanged it for a session. We wait for
  // that (or an already-present session) before showing the form.
  useEffect(() => {
    let settled = false;
    const markReady = () => {
      if (settled) return;
      settled = true;
      setPhase("ready");
    };

    const { data: { subscription } } = guestAuth.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) markReady();
    });

    guestAuth.auth.getSession().then(({ data }) => {
      if (data.session) markReady();
    });

    // If the hash never produced a session, the link is stale or was opened directly.
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setPhase("invalid");
      }
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading(true);

    const { error: authError } = await guestAuth.auth.updateUser({ password });
    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    // Force a clean sign-in with the new password rather than riding the
    // short-lived recovery session.
    await guestAuth.auth.signOut().catch(() => undefined);
    setLoading(false);
    setPhase("done");
  };

  if (phase === "checking") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <p className="text-sm text-ink-500">Verifying your reset link…</p>
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="h-display text-2xl mb-2">Link expired</h1>
          <p className="text-sm text-ink-600">
            This password-reset link is invalid or has already been used. Request a new one to try again.
          </p>
          <Link
            href={`/account/forgot${isAdmin ? "?as=admin" : ""}`}
            className="btn-primary inline-flex mt-6 px-5 py-2.5 text-sm"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <ShieldCheck className="mx-auto mb-3 text-emerald-600" size={32} />
          <h1 className="h-display text-2xl mb-2">Password updated</h1>
          <p className="text-sm text-ink-600">
            Your password has been changed. Sign in with your new password to continue.
          </p>
          <button
            onClick={() => router.replace(signInPath)}
            className="btn-primary inline-flex mt-6 px-5 py-2.5 text-sm"
          >
            Go to sign in
          </button>
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
          <h1 className="h-display text-3xl">Choose a new password</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            Pick something you haven&rsquo;t used before.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="password">New password</label>
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
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
