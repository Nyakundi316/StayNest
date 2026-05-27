"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { establishAdminSession, supabaseAuth } from "@/lib/supabase-auth";
import { Eye, EyeOff } from "lucide-react";

function safeNext(value: string | null): string {
  if (!value) return "/admin";
  if (!value.startsWith("/admin")) return "/admin";
  if (value.startsWith("//")) return "/admin";
  return value;
}

function AdminLoginInner() {
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

    const { error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    try {
      await establishAdminSession();
      router.replace(next);
    } catch (sessionError: any) {
      await supabaseAuth.auth.signOut();
      setError(sessionError.message ?? "This account is not authorized for admin access.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
            StayNest
          </div>
          <h1 className="h-display text-3xl">Admin sign in</h1>
          <p className="text-sm text-ink-500 mt-1.5">
            Enter your credentials to access the control room.
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
              placeholder="agent@staynest.co.ke"
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
            className="btn-primary w-full py-3 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  );
}
