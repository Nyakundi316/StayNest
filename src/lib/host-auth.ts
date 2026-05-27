import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { resolveGuestUser } from "@/lib/guest-auth-server";

export interface HostContext {
  userId: string;
  ownerId: string;
  email: string;
}

type HostResult =
  | { host: HostContext; error: null }
  | { host: null; error: NextResponse };

// Resolves the host record from the Authorization Bearer token, auto-linking
// the owners row by email on first sign-in if it isn't linked yet.
//
// Used both by the session-cookie route (to verify before issuing the
// cookie) and by host-only API routes that take the access token directly,
// matching the admin pattern in lib/admin-auth.ts.
export async function requireHost(req: NextRequest): Promise<HostResult> {
  const user = await resolveGuestUser(req);
  if (!user) return { host: null, error: unauthorized() };

  const db = createServerClient();

  const { data: byUser, error: byUserErr } = await db
    .from("owners")
    .select("id, email, user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (byUserErr) {
    return { host: null, error: NextResponse.json({ error: byUserErr.message }, { status: 500 }) };
  }
  if (byUser) {
    return {
      host: { userId: user.id, ownerId: byUser.id, email: user.email ?? byUser.email ?? "" },
      error: null
    };
  }

  // Auto-link by email when the owner row exists but isn't linked yet.
  if (user.email) {
    const { data: byEmail, error: byEmailErr } = await db
      .from("owners")
      .select("id, email, user_id")
      .ilike("email", user.email)
      .is("user_id", null)
      .maybeSingle();
    if (byEmailErr) {
      return { host: null, error: NextResponse.json({ error: byEmailErr.message }, { status: 500 }) };
    }
    if (byEmail) {
      const { error: linkErr } = await db
        .from("owners")
        .update({ user_id: user.id })
        .eq("id", byEmail.id);
      if (linkErr) {
        return { host: null, error: NextResponse.json({ error: linkErr.message }, { status: 500 }) };
      }
      return {
        host: { userId: user.id, ownerId: byEmail.id, email: user.email },
        error: null
      };
    }
  }

  return {
    host: null,
    error: NextResponse.json(
      { error: "This account isn't linked to any property. Ask the StayNest team to add you as an owner." },
      { status: 403 }
    )
  };
}

function unauthorized() {
  return NextResponse.json({ error: "Host authentication required." }, { status: 401 });
}
