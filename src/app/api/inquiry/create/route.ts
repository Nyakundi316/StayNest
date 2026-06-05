import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { emailInquiryReceived, emailInquiryAlert } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Writes a row + two emails per call; same budget as booking creation.
    const limited = await enforceRateLimit(req, { key: "inquiry-create", max: 5, windowSec: 600 });
    if (limited) return limited;

    const input = await req.json();
    const db = createServerClient();

    const { data, error } = await db
      .from("inquiries")
      .insert({
        property_id: input.propertyId,
        kind: input.kind,
        guest_name: input.guestName,
        guest_email: input.guestEmail,
        guest_phone: input.guestPhone,
        preferred_date: input.preferredDate ?? null,
        offer_amount: input.offerAmount ?? null,
        move_in_date: input.moveInDate ?? null,
        lease_term_months: input.leaseTermMonths ?? null,
        message: input.message ?? null,
        status: "new"
      })
      .select("id")
      .single();

    if (error) throw error;

    const { data: prop } = await db
      .from("properties")
      .select("name")
      .eq("id", input.propertyId)
      .single();

    const propertyName = prop?.name ?? "the property";

    await Promise.allSettled([
      emailInquiryReceived({
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        propertyName,
        kind: input.kind
      }),
      emailInquiryAlert({
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        propertyName,
        kind: input.kind,
        preferredDate: input.preferredDate,
        offerAmount: input.offerAmount,
        moveInDate: input.moveInDate,
        leaseTermMonths: input.leaseTermMonths,
        message: input.message
      })
    ]);

    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    console.error("inquiry/create error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to create inquiry" }, { status: 500 });
  }
}
