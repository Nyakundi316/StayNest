import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  mapProperty,
  mapOwner,
  mapBooking,
  mapInquiry,
  mapRestockSubscription
} from "@/lib/data";

// Admin-only snapshot of everything the dashboard needs, read with the
// service-role key. Replaces the old anon-client reads that leaked owner
// economics to anyone who opened the network tab.
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const db = createServerClient();
    const [props, owners, bookings, inquiries, restock] = await Promise.all([
      db.from("properties").select("*").order("created_at", { ascending: true }),
      db.from("owners").select("*").order("created_at", { ascending: true }),
      db.from("bookings").select("*").order("created_at", { ascending: false }),
      db.from("inquiries").select("*").order("created_at", { ascending: false }),
      db.from("restock_subscriptions").select("*").order("created_at", { ascending: false })
    ]);

    const firstErr =
      props.error || owners.error || bookings.error || inquiries.error || restock.error;
    if (firstErr) throw firstErr;

    return NextResponse.json({
      properties: (props.data ?? []).map(mapProperty),
      owners: (owners.data ?? []).map(mapOwner),
      bookings: (bookings.data ?? []).map(mapBooking),
      inquiries: (inquiries.data ?? []).map(mapInquiry),
      restockSubscriptions: (restock.data ?? []).map(mapRestockSubscription)
    });
  } catch (err: any) {
    console.error("admin/overview error:", err);
    return NextResponse.json(
      { error: err.message ?? "Failed to load admin data" },
      { status: 500 }
    );
  }
}
