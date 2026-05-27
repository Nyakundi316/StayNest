import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

// Polled by the booking page every few seconds to check if payment completed.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const db = createServerClient();
    const { data, error } = await db
      .from("bookings")
      .select("payment_status, mpesa_receipt_number, status")
      .eq("id", bookingId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      paymentStatus: data.payment_status,
      mpesaReceiptNumber: data.mpesa_receipt_number,
      status: data.status
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
