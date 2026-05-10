import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { emailPaymentConfirmed } from "@/lib/email";

// Safaricom posts the payment result here after the customer enters their PIN.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    if (!callback) return NextResponse.json({ ok: true });

    const checkoutRequestId: string = callback.CheckoutRequestID;
    const resultCode: number = callback.ResultCode;

    const db = createServerClient();

    if (resultCode === 0) {
      // Payment successful — extract receipt number from metadata
      const items: Array<{ Name: string; Value: unknown }> =
        callback.CallbackMetadata?.Item ?? [];
      const receipt = items.find((i) => i.Name === "MpesaReceiptNumber")?.Value as string | undefined;

      const { data: updated } = await db
        .from("bookings")
        .update({
          payment_status: "paid",
          status: "confirmed",
          mpesa_receipt_number: receipt ?? null
        })
        .eq("mpesa_checkout_request_id", checkoutRequestId)
        .select("guest_name, guest_email, check_in, check_out, nights, total, property_id")
        .single();

      // Send confirmation email — fetch property name first
      if (updated) {
        const { data: prop } = await db
          .from("properties")
          .select("name")
          .eq("id", updated.property_id)
          .single();

        await emailPaymentConfirmed({
          guestName: updated.guest_name,
          guestEmail: updated.guest_email,
          propertyName: prop?.name ?? "your property",
          checkIn: updated.check_in,
          checkOut: updated.check_out,
          nights: updated.nights,
          total: updated.total,
          receiptNumber: receipt ?? null
        }).catch((e) => console.error("payment confirmed email failed:", e));
      }
    } else {
      await db
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("mpesa_checkout_request_id", checkoutRequestId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mpesa callback error:", err);
    // Always return 200 to Safaricom so they don't retry indefinitely
    return NextResponse.json({ ok: true });
  }
}
