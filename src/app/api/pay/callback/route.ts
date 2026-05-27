import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { emailPaymentConfirmed } from "@/lib/email";
import { getMpesaConfig, timingSafeEqual } from "@/lib/mpesa";

interface CallbackItem {
  Name: string;
  Value?: unknown;
}

function callbackItem(items: CallbackItem[], name: string): unknown {
  return items.find((item) => item.Name === name)?.Value;
}

function maskPhone(phone: string): string {
  return phone.length > 4 ? `${"*".repeat(phone.length - 4)}${phone.slice(-4)}` : "****";
}

function verifyCallbackSecret(req: NextRequest): boolean {
  const loaded = getMpesaConfig();
  if (!loaded.ok) return false;

  const provided =
    req.nextUrl.searchParams.get("token") ??
    req.headers.get("x-mpesa-callback-secret") ??
    "";

  return timingSafeEqual(provided, loaded.config.callbackSecret);
}

// Safaricom posts the STK result here after the customer enters their PIN.
export async function POST(req: NextRequest) {
  try {
    if (!verifyCallbackSecret(req)) {
      return NextResponse.json({ error: "Invalid callback token." }, { status: 401 });
    }

    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    if (!callback || typeof callback !== "object") {
      return NextResponse.json({ error: "Invalid callback payload." }, { status: 400 });
    }

    const checkoutRequestId =
      typeof callback.CheckoutRequestID === "string"
        ? callback.CheckoutRequestID
        : "";
    const resultCode = Number(callback.ResultCode);
    const resultDesc =
      typeof callback.ResultDesc === "string"
        ? callback.ResultDesc
        : "M-Pesa payment was not completed.";

    if (!checkoutRequestId || !Number.isInteger(resultCode)) {
      return NextResponse.json({ error: "Invalid callback fields." }, { status: 400 });
    }

    const db = createServerClient();

    if (resultCode !== 0) {
      const { error } = await db
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("mpesa_checkout_request_id", checkoutRequestId)
        .eq("payment_status", "pending");
      if (error) throw error;

      console.warn("[mpesa] payment failed:", checkoutRequestId, resultCode, resultDesc);
      return NextResponse.json({ ok: true });
    }

    const items: CallbackItem[] = Array.isArray(callback.CallbackMetadata?.Item)
      ? callback.CallbackMetadata.Item
      : [];
    const receiptValue = callbackItem(items, "MpesaReceiptNumber");
    const amountValue = callbackItem(items, "Amount");
    const phoneValue = callbackItem(items, "PhoneNumber");

    const receipt = typeof receiptValue === "string" ? receiptValue : String(receiptValue ?? "");
    const paidAmount = Number(amountValue);
    const paidPhone = phoneValue ? String(phoneValue) : null;

    if (!receipt || !Number.isFinite(paidAmount) || paidAmount < 1) {
      console.error("[mpesa] successful callback missing receipt or amount:", checkoutRequestId);
      return NextResponse.json({ ok: true });
    }

    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select(
        "id, guest_name, guest_email, check_in, check_out, nights, total, status, payment_status, property_id"
      )
      .eq("mpesa_checkout_request_id", checkoutRequestId)
      .maybeSingle();

    if (bookingErr) throw bookingErr;
    if (!booking) {
      console.warn("[mpesa] callback for unknown checkout request:", checkoutRequestId);
      return NextResponse.json({ ok: true });
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({ ok: true });
    }

    if (booking.payment_status !== "pending") {
      console.warn("[mpesa] callback ignored for non-pending booking:", booking.id, booking.payment_status);
      return NextResponse.json({ ok: true });
    }

    const expectedAmount = Math.round(Number(booking.total));
    if (Math.round(paidAmount) !== expectedAmount) {
      console.error(
        "[mpesa] amount mismatch:",
        checkoutRequestId,
        "expected",
        expectedAmount,
        "paid",
        paidAmount
      );
      await db
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("id", booking.id)
        .eq("payment_status", "pending");
      return NextResponse.json({ ok: true });
    }

    const nextStatus = booking.status === "pending" ? "confirmed" : booking.status;
    const { data: updated, error: updateErr } = await db
      .from("bookings")
      .update({
        payment_status: "paid",
        status: nextStatus,
        mpesa_receipt_number: receipt
      })
      .eq("id", booking.id)
      .eq("payment_status", "pending")
      .select("guest_name, guest_email, check_in, check_out, nights, total, status, property_id")
      .maybeSingle();

    if (updateErr) throw updateErr;
    if (!updated) return NextResponse.json({ ok: true });

    if (paidPhone) {
      console.info("[mpesa] payment confirmed:", checkoutRequestId, maskPhone(paidPhone));
    }

    // Only send a booking-confirmed email when the callback actually confirmed it.
    if (updated.status === "confirmed") {
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
        receiptNumber: receipt
      }).catch((e) => console.error("payment confirmed email failed:", e));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("mpesa callback error:", err);
    // Return 200 for processing errors after token validation so Safaricom does not retry indefinitely.
    return NextResponse.json({ ok: true });
  }
}
