import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const propertyId = typeof input.propertyId === "string" ? input.propertyId : "";
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";

    if (!propertyId || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const db = createServerClient();
    const { data: property, error: propertyErr } = await db
      .from("properties")
      .select("id, archived, available")
      .eq("id", propertyId)
      .maybeSingle();

    if (propertyErr) throw propertyErr;
    if (!property || property.archived) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    if (property.available) {
      return NextResponse.json({ error: "This listing is already available." }, { status: 409 });
    }

    const { error } = await db
      .from("restock_subscriptions")
      .upsert(
        {
          property_id: propertyId,
          email,
          status: "active",
          notified_at: null
        },
        { onConflict: "property_id,email" }
      );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("restock subscribe error:", err);
    return NextResponse.json(
      { error: err.message ?? "Could not save notification request." },
      { status: 500 }
    );
  }
}
