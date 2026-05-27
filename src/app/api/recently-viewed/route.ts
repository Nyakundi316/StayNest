import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { mapProperty } from "@/lib/data";

const MAX_RECENT = 8;

function cleanGuestId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^[a-zA-Z0-9_-]{12,80}$/.test(trimmed) ? trimmed : null;
}

async function authUserId(req: NextRequest, db: ReturnType<typeof createServerClient>) {
  const header = req.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const db = createServerClient();
    const userId = await authUserId(req, db);
    const guestId = cleanGuestId(req.nextUrl.searchParams.get("guestId"));
    if (!userId && !guestId) return NextResponse.json({ properties: [] });

    let query = db
      .from("recently_viewed_properties")
      .select("property_id")
      .order("viewed_at", { ascending: false })
      .limit(MAX_RECENT);

    query = userId ? query.eq("user_id", userId) : query.eq("guest_id", guestId!);

    const { data: rows, error } = await query;
    if (error) throw error;

    const ids = (rows ?? []).map((r) => r.property_id).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ properties: [] });

    const { data: props, error: propErr } = await db
      .from("properties_public")
      .select("*")
      .in("id", ids);

    if (propErr) throw propErr;

    const byId = new Map((props ?? []).map((p) => [p.id, mapProperty(p)]));
    const properties = ids.map((id) => byId.get(id)).filter(Boolean);

    return NextResponse.json({ properties });
  } catch (err: any) {
    console.error("recently viewed GET error:", err);
    return NextResponse.json({ properties: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const propertyId = typeof input.propertyId === "string" ? input.propertyId : "";
    const guestId = cleanGuestId(input.guestId);

    const db = createServerClient();
    const userId = await authUserId(req, db);

    if (!propertyId || (!userId && !guestId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let findQuery = db
      .from("recently_viewed_properties")
      .select("id")
      .eq("property_id", propertyId);
    findQuery = userId ? findQuery.eq("user_id", userId) : findQuery.eq("guest_id", guestId!);

    const { data: existing, error: findErr } = await findQuery.maybeSingle();

    if (findErr) throw findErr;

    const viewedAt = new Date().toISOString();
    const { error } = existing
      ? await db
          .from("recently_viewed_properties")
          .update({ viewed_at: viewedAt })
          .eq("id", existing.id)
      : await db
          .from("recently_viewed_properties")
          .insert({
            property_id: propertyId,
            guest_id: userId ? null : guestId,
            user_id: userId,
            viewed_at: viewedAt
          });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("recently viewed POST error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
