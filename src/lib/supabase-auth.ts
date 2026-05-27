import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Separate client for admin auth — persists session in localStorage across page reloads.
// The main supabase client (supabase.ts) intentionally disables persistSession for
// anonymous data reads; this one is only used for sign-in / sign-out / session checks.
export const supabaseAuth = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "staynest-admin"
  }
});

/**
 * Auth headers for admin-only API calls. The server validates this token via
 * `requireAdmin` (lib/admin-auth.ts), so admin endpoints reject anonymous
 * callers even though the session itself lives in localStorage.
 */
export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabaseAuth.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function establishAdminSession(): Promise<void> {
  const res = await fetch("/api/admin/session", {
    method: "POST",
    headers: await authHeaders()
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Admin access was not authorized.");
}

export async function clearAdminSession(): Promise<void> {
  await fetch("/api/admin/session", { method: "DELETE" }).catch(() => undefined);
}
