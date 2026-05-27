"use client";

import { createClient, type Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Separate Supabase client for guest accounts. Uses its own storageKey so a
// guest signed-in to /account does not collide with an admin signed-in to
// /admin (those use lib/supabase-auth.ts with storageKey "staynest-admin").
export const guestAuth = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "staynest-guest"
  }
});

export async function guestAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await guestAuth.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function establishHostSession(): Promise<void> {
  const res = await fetch("/api/host/session", {
    method: "POST",
    headers: await guestAuthHeaders()
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Host access was not authorized.");
}

export async function clearHostSession(): Promise<void> {
  await fetch("/api/host/session", { method: "DELETE" }).catch(() => undefined);
}

export function useGuestSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    guestAuth.auth.getSession().then(({ data }) => {
      if (alive) setSession(data.session ?? null);
    });

    const { data: { subscription } } = guestAuth.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return session;
}
