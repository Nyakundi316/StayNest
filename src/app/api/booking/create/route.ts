import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { emailBookingReceived, emailBookingAlert } from "@/lib/email";
import { mapProperty } from "@/lib/data";
import { buildPriceBreakdown, nightsBetween } from "@/lib/pricing";
import { resolveGuestUser } from "@/lib/guest-auth-server";
import { createBookingAccessToken, manageBookingUrl } from "@/lib/booking-access";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const db = createServerClient();
    const guest = await resolveGuestUser(req);

    if (!input.propertyId || !input.guestName || !input.guestEmail || !input.guestPhone) {
      return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
    }

    const nights = nightsBetween(input.checkIn, input.checkOut);
    if (nights < 1) {
      return NextResponse.json({ error: "Choose valid check-in and check-out dates." }, { status: 400 });
    }

    const { data: propertyRow, error: propertyErr } = await db
      .from("properties")
      .select("*")
      .eq("id", input.propertyId)
      .maybeSingle();

    if (propertyErr) throw propertyErr;
    if (!propertyRow || propertyRow.archived || !propertyRow.available) {
      return NextResponse.json({ error: "This property is not available." }, { status: 404 });
    }
    if (propertyRow.listing_type !== "short_stay") {
      return NextResponse.json({ error: "This listing cannot be booked as a short stay." }, { status: 400 });
    }

    const guests = Math.max(Number(input.guests) || 1, 1);
    if (guests > Number(propertyRow.guests ?? 1)) {
      return NextResponse.json({ error: "Guest count exceeds this property's capacity." }, { status: 400 });
    }

    const { data: overlapping, error: overlapErr } = await db
      .from("bookings")
      .select("id")
      .eq("property_id", input.propertyId)
      .neq("status", "cancelled")
      .lt("check_in", input.checkOut)
      .gt("check_out", input.checkIn)
      .limit(1);

    if (overlapErr) throw overlapErr;
    if ((overlapping ?? []).length > 0) {
      return NextResponse.json(
        { error: "Those dates are no longer available for this property." },
        { status: 409 }
      );
    }

    const property = mapProperty(propertyRow);
    const price = buildPriceBreakdown(property, nights);

    const { data, error } = await db
      .from("bookings")
      .insert({
        property_id: input.propertyId,
        guest_name: input.guestName,
        guest_email: input.guestEmail,
        guest_phone: input.guestPhone,
        check_in: input.checkIn,
        check_out: input.checkOut,
        guests,
        nights,
        price_per_night: price.perNight,
        subtotal: price.subtotal,
        service_fee: price.serviceFee,
        total: price.total,
        owner_payout: price.ownerPayout,
        agent_profit: price.agentProfit,
        status: "pending",
        payment_status: "unpaid",
        user_id: guest?.id ?? null
      })
      .select("id")
      .single();

    if (error) throw error;

    const propertyName = property.name;
    const propertyLocation = property.location;

    // Magic-link token so anonymous guests can come back to view/cancel.
    // Signed-in guests can use /account/bookings, but the link is harmless
    // and useful if they switch devices or lose the session.
    const accessToken = await createBookingAccessToken(data.id, input.guestEmail).catch(() => null);
    const manageUrl = accessToken ? manageBookingUrl(data.id, accessToken, req.nextUrl.origin) : null;

    // Send both emails in parallel — don't let email failure block the response
    await Promise.allSettled([
      emailBookingReceived({
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        propertyName,
        propertyLocation,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights,
        total: price.total,
        manageUrl
      }),
      emailBookingAlert({
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        propertyName,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights,
        total: price.total,
        ownerPayout: price.ownerPayout,
        agentProfit: price.agentProfit,
        bookingId: data.id
      })
    ]);

    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    console.error("booking/create error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to create booking" }, { status: 500 });
  }
}
