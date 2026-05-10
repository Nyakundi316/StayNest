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
