import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createBookingAccessToken, manageBookingUrl } from "@/lib/booking-access";
import { emailBookingLinks } from "@/lib/email";

// Anonymous "I lost my manage link" recovery.
// Deliberately ALWAYS returns 200 with the same body whether or not a
// booking was found — that way the endpoint can't be used to enumerate
// which emails have booked with us.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const db = createServerClient();
    // Return the 10 most recent bookings on this email regardless of
    // status. Completed/cancelled show as read-only on /manage; the cap is
    // the real safety, not the status filter.
    const { data, error } = await db
      .from("bookings")
      .select(`
        id, status, check_in, check_out, guest_email,
        property:properties (name)
      `)
      .ilike("guest_email", email)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("booking/find lookup error:", error);
      // Swallow — same opaque response as success.
    }

    const matches = data ?? [];
    if (matches.length > 0) {
      const links = await Promise.all(
        matches.map(async (b) => {
          const token = await createBookingAccessToken(b.id, email);
          const property = Array.isArray(b.property) ? b.property[0] : b.property;
          return {
            propertyName: property?.name ?? "Your booking",
            checkIn: b.check_in,
            checkOut: b.check_out,
            status: b.status,
            manageUrl: manageBookingUrl(b.id, token, req.nextUrl.origin)
          };
        })
      );
      emailBookingLinks({ email, bookings: links }).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("booking/find error:", err);
    // Still respond with 200/ok to avoid leaking infrastructure errors as a
    // distinguishable signal. Operator sees the real cause in logs.
    return NextResponse.json({ ok: true });
  }
}
