import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { resolveGuestUser } from "@/lib/guest-auth-server";
import { verifyBookingAccessToken } from "@/lib/booking-access";
import { emailBookingCancelled, emailBookingCancelledHost } from "@/lib/email";

const LATE_WINDOW_HOURS = 48;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = createServerClient();

    const { data: booking, error: fetchErr } = await db
      .from("bookings")
      .select("*, properties:property_id (id, name, owner_id)")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "This booking is already cancelled." }, { status: 409 });
    }
    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Completed bookings can't be cancelled." },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reasonInput = typeof body.reason === "string" ? body.reason.trim() : "";
    const rawToken = typeof body.token === "string" ? body.token : null;

    // Authorization: any one of three paths.
    //   1. Bearer JWT for the booking's owning guest (account holder).
    //   2. Bearer JWT for a host whose owner row owns the property.
    //   3. Signed magic-link token for the original guest email (anonymous).
    let actor: "guest" | "host" | null = null;
    let actorEmail: string | null = null;

    const user = await resolveGuestUser(req);
    if (user) {
      const isGuest = booking.user_id && booking.user_id === user.id;
      if (isGuest) {
        actor = "guest";
        actorEmail = user.email;
      } else {
        const { data: owner } = await db
          .from("owners")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        const ownerId = booking.properties?.owner_id ?? null;
        if (owner && ownerId && owner.id === ownerId) {
          actor = "host";
          actorEmail = user.email;
        }
      }
    }

    if (!actor && rawToken) {
      const payload = await verifyBookingAccessToken(rawToken, id);
      if (payload && payload.email.toLowerCase() === String(booking.guest_email).toLowerCase()) {
        actor = "guest";
        actorEmail = payload.email;
      }
    }

    if (!actor) {
      return NextResponse.json(
        { error: "You don't have permission to cancel this booking." },
        { status: 403 }
      );
    }

    // Policy
    const hoursToCheckIn = (new Date(booking.check_in).getTime() - Date.now()) / (1000 * 60 * 60);
    const isLate = hoursToCheckIn < LATE_WINDOW_HOURS;
    const policy = isLate ? "late" : "free";

    const reason = reasonInput
      ? `${reasonInput} (${policy})`
      : actor === "host"
        ? `Cancelled by host (${policy})`
        : `Cancelled by guest (${policy})`;

    const { error: updateErr } = await db
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: actor,
        cancellation_reason: reason
      })
      .eq("id", id);
    if (updateErr) throw updateErr;

    const propertyName = booking.properties?.name ?? "your property";

    // Guest-facing confirmation
    emailBookingCancelled({
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      propertyName,
      checkIn: booking.check_in,
      checkOut: booking.check_out
    }).catch(console.error);

    // Notify the host whenever the guest is the one cancelling.
    if (actor === "guest" && booking.properties?.owner_id) {
      const { data: owner } = await db
        .from("owners")
        .select("name, email")
        .eq("id", booking.properties.owner_id)
        .maybeSingle();
      if (owner?.email) {
        emailBookingCancelledHost({
          hostName: owner.name ?? "there",
          hostEmail: owner.email,
          guestName: booking.guest_name,
          propertyName,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          nights: booking.nights,
          reason: reasonInput || null,
          isLate
        }).catch(console.error);
      }
    }

    return NextResponse.json({
      ok: true,
      policy,
      refundEligible: !isLate && booking.payment_status === "paid",
      actor,
      actorEmail
    });
  } catch (err: any) {
    console.error("booking/cancel error:", err);
    return NextResponse.json({ error: err.message ?? "Cancellation failed." }, { status: 500 });
  }
}
