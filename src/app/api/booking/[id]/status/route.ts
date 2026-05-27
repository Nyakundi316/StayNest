import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { emailPaymentConfirmed, emailBookingCancelled, emailReviewRequest } from "@/lib/email";
import { createBookingAccessToken, manageBookingUrl } from "@/lib/booking-access";

const VALID: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { status } = await req.json();
    const db = createServerClient();

    // Fetch current booking to validate transition
    const { data: booking, error: fetchErr } = await db
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const allowed = VALID[booking.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${booking.status} → ${status}` },
        { status: 400 }
      );
    }

    await db.from("bookings").update({ status }).eq("id", id);

    // Fetch property name for emails
    const { data: prop } = await db
      .from("properties")
      .select("name")
      .eq("id", booking.property_id)
      .single();
    const propertyName = prop?.name ?? "your property";

    if (status === "confirmed") {
      const token = await createBookingAccessToken(id, booking.guest_email).catch(() => null);
      const manageUrl = token ? manageBookingUrl(id, token, req.nextUrl.origin) : null;
      emailPaymentConfirmed({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        propertyName,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        nights: booking.nights,
        total: booking.total,
        receiptNumber: booking.mpesa_receipt_number ?? null,
        manageUrl
      }).catch(console.error);
    }

    if (status === "completed") {
      emailReviewRequest({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        propertyName,
        checkOut: booking.check_out,
        bookingId: id
      }).catch(console.error);
    }

    if (status === "cancelled") {
      emailBookingCancelled({
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        propertyName,
        checkIn: booking.check_in,
        checkOut: booking.check_out
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("booking status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
