import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireHost } from "@/lib/host-auth";

// What the host sees is deliberately a subset of the admin overview:
// no markup, no agent profit, no other owners' data. The host gets
// ownerBasePrice (their listed price) and ownerPayout (what they earn).
export async function GET(req: NextRequest) {
  const result = await requireHost(req);
  if (result.error) return result.error;
  const { host } = result;

  try {
    const db = createServerClient();

    const [ownerRes, propsRes] = await Promise.all([
      db.from("owners")
        .select("id, name, phone, email, payout_method")
        .eq("id", host.ownerId)
        .maybeSingle(),
      db.from("properties")
        .select(
          "id, name, location, city, type, listing_type, images, bedrooms, bathrooms, guests, owner_base_price, available, archived, rating, reviews, created_at"
        )
        .eq("owner_id", host.ownerId)
        .order("created_at", { ascending: true })
    ]);

    if (ownerRes.error) throw ownerRes.error;
    if (propsRes.error) throw propsRes.error;

    const propertyIds = (propsRes.data ?? []).map((p) => p.id);
    let bookingRows: any[] = [];
    if (propertyIds.length > 0) {
      const { data, error } = await db
        .from("bookings")
        .select(
          "id, property_id, guest_name, guest_email, guest_phone, check_in, check_out, nights, guests, owner_payout, status, payment_status, created_at"
        )
        .in("property_id", propertyIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      bookingRows = data ?? [];
    }

    const upcoming = bookingRows.filter(
      (b) => b.status !== "cancelled" && new Date(b.check_in) >= startOfToday()
    );
    const totalPayout = bookingRows
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + Number(b.owner_payout ?? 0), 0);

    return NextResponse.json({
      owner: ownerRes.data
        ? {
            id: ownerRes.data.id,
            name: ownerRes.data.name,
            phone: ownerRes.data.phone,
            email: ownerRes.data.email ?? null,
            payoutMethod: ownerRes.data.payout_method ?? null
          }
        : null,
      properties: (propsRes.data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        location: p.location,
        city: p.city,
        type: p.type,
        listingType: p.listing_type ?? "short_stay",
        images: Array.isArray(p.images) ? p.images : [],
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        guests: p.guests,
        ownerBasePrice: p.owner_base_price ?? 0,
        available: p.available,
        archived: Boolean(p.archived ?? false),
        rating: Number(p.rating ?? 0),
        reviews: p.reviews ?? 0,
        createdAt: p.created_at
      })),
      bookings: bookingRows.map((b) => ({
        id: b.id,
        propertyId: b.property_id,
        guestName: b.guest_name,
        guestEmail: b.guest_email,
        guestPhone: b.guest_phone,
        checkIn: b.check_in,
        checkOut: b.check_out,
        nights: b.nights,
        guests: b.guests,
        ownerPayout: Number(b.owner_payout ?? 0),
        status: b.status,
        paymentStatus: b.payment_status ?? "unpaid",
        createdAt: b.created_at
      })),
      totals: {
        properties: propsRes.data?.length ?? 0,
        upcomingBookings: upcoming.length,
        totalPayout
      }
    });
  } catch (err: any) {
    console.error("host/overview error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load host data" },
      { status: 500 }
    );
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
