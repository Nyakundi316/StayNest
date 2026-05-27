import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Admin allowlist. Prefer ADMIN_EMAILS; fall back to AGENT_EMAIL for local
// prototypes where the owner/operator address is already configured.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.AGENT_EMAIL ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AdminUser {
  id: string;
  email: string;
}

type AdminResult =
  | { user: AdminUser; error: null }
  | { user: null; error: NextResponse };

/**
 * Verifies the caller is an authenticated admin.
 *
 * The admin SPA stores its Supabase session in localStorage and attaches the
 * access token as `Authorization: Bearer <token>` (see lib/supabase-auth.ts
 * `authHeaders`). We validate that token against Supabase server-side, so
 * these endpoints can't be called directly by the public.
 *
 * Returns either the verified `user`, or a ready-to-return `error` response.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminResult> {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";

  if (!token) {
    return { user: null, error: unauthorized() };
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: unauthorized() };
  }

  const email = (data.user.email ?? "").toLowerCase();
  if (ADMIN_EMAILS.length === 0) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "No admin allowlist is configured. Set ADMIN_EMAILS." },
        { status: 403 }
      )
    };
  }

  if (!ADMIN_EMAILS.includes(email)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "This account is not authorized for admin access." },
        { status: 403 }
      )
    };
  }

  return { user: { id: data.user.id, email }, error: null };
}

function unauthorized() {
  return NextResponse.json(
    { error: "Admin authentication required." },
    { status: 401 }
  );
}
