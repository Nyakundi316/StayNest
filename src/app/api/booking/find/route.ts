import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { createBookingAccessToken, manageBookingUrl } from "@/lib/booking-access";
import { emailBookingLinks } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Anonymous "I lost my manage link" recovery.
// Deliberately ALWAYS returns 200 with the same body whether or not a
// booking was found — that way the endpoint can't be used to enumerate
// which emails have booked with us.
export async function POST(req: NextRequest) {
  try {
    // 3 requests / minute / IP. Anything more is bot territory; legitimate
    // users only hit this once. We respond 429 so the form can surface a
    // helpful message — there's no email enumeration concern here because
    // the IP is the rate key, not the email.
    const rl = await rateLimit({
      key: "booking-find",
      identifier: clientIp(req),
      max: 3,
      windowSec: 60
    });
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.resetIn} seconds.` },
        { status: 429, headers: { "Retry-After": String(rl.resetIn) } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    // Honeypot: real users never see/fill the `website` field, so anything
    // non-empty is a bot. Return the same 200 the success path returns so
    // we don't tell the bot it tripped the trap.
    const honeypot = typeof body.website === "string" ? body.website.trim() : "";
    if (honeypot) {
      console.warn("[booking/find] honeypot tripped");
      return NextResponse.json({ ok: true });
    }

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
