import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { resolveGuestUser } from "@/lib/guest-auth-server";

export async function GET(req: NextRequest) {
  const user = await resolveGuestUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const db = createServerClient();
  const { data, error } = await db
    .from("bookings")
    .select(`
      id, status, payment_status, check_in, check_out, nights, guests,
      total, price_per_night, service_fee, created_at,
      property:properties (id, name, location, city, images, type)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [] });
}
