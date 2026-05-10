import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const db = createServerClient();

  const { data: booking, error } = await db
    .from("bookings")
    .select("id, guest_name, status, property_id, check_out")
    .eq("id", params.bookingId)
    .maybeSingle();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.status !== "completed") {
    return NextResponse.json({ error: "This booking is not completed yet" }, { status: 400 });
  }

  const { data: existing } = await db
    .from("reviews")
    .select("id")
    .eq("booking_id", params.bookingId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ alreadyReviewed: true });
  }

  const { data: prop } = await db
    .from("properties")
    .select("name, location, city")
    .eq("id", booking.property_id)
    .maybeSingle();

  return NextResponse.json({
    guestName: booking.guest_name,
    checkOut: booking.check_out,
    propertyName: prop?.name ?? "the property",
    propertyLocation: prop ? `${prop.location}, ${prop.city}` : ""
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const { guestName, rating, comment } = await req.json();

    if (!guestName?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }

    const db = createServerClient();

    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select("id, status, property_id")
      .eq("id", params.bookingId)
      .maybeSingle();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.status !== "completed") {
      return NextResponse.json({ error: "Booking is not completed" }, { status: 400 });
    }

    const { data: existing } = await db
      .from("reviews")
      .select("id")
      .eq("booking_id", params.bookingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
    }

    const { data: review, error: insertErr } = await db
      .from("reviews")
      .insert({
        property_id: booking.property_id,
        booking_id: params.bookingId,
        guest_name: guestName.trim(),
        rating,
        comment: comment?.trim() || null
      })
      .select("*")
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ ok: true, review });
  } catch (err: any) {
    console.error("review create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
