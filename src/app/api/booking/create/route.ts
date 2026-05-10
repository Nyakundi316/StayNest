import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { emailBookingReceived, emailBookingAlert } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const input = await req.json();
    const db = createServerClient();

    const { data, error } = await db
      .from("bookings")
      .insert({
        property_id: input.propertyId,
        guest_name: input.guestName,
        guest_email: input.guestEmail,
        guest_phone: input.guestPhone,
        check_in: input.checkIn,
        check_out: input.checkOut,
        guests: input.guests,
        nights: input.nights,
        price_per_night: input.pricePerNight,
        subtotal: input.subtotal,
        service_fee: input.serviceFee,
        total: input.total,
        owner_payout: input.ownerPayout,
        agent_profit: input.agentProfit,
        status: "pending",
        payment_status: "unpaid"
      })
      .select("id")
      .single();

    if (error) throw error;

    // Fetch property name/location for emails
    const { data: prop } = await db
      .from("properties")
      .select("name, location")
      .eq("id", input.propertyId)
      .single();

    const propertyName = prop?.name ?? "your property";
    const propertyLocation = prop?.location ?? "";

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
        nights: input.nights,
        total: input.total
      }),
      emailBookingAlert({
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        propertyName,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights: input.nights,
        total: input.total,
        ownerPayout: input.ownerPayout,
        agentProfit: input.agentProfit,
        bookingId: data.id
      })
    ]);

    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    console.error("booking/create error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to create booking" }, { status: 500 });
  }
}
