import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  callbackUrlWithSecret,
  getMpesaConfig,
  normalizeMpesaPhone,
  type MpesaConfig
} from "@/lib/mpesa";

async function getMpesaToken(config: MpesaConfig): Promise<string> {
  const credentials = Buffer.from(
    `${config.consumerKey}:${config.consumerSecret}`
  ).toString("base64");

  const res = await fetch(`${config.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status}`);
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  // Guard: if credentials aren't configured, tell the client to skip to manual flow
  const loaded = getMpesaConfig();
  if (!loaded.ok) {
    console.warn("[mpesa] disabled; missing or invalid env:", loaded.missing.join(", "));
    return NextResponse.json({ unconfigured: true }, { status: 200 });
  }
  const { config } = loaded;

  try {
    const { bookingId, phone } = await req.json();
    if (!bookingId || !phone) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedPhone = normalizeMpesaPhone(phone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Enter a valid Safaricom phone number." },
        { status: 400 }
      );
    }

    const db = createServerClient();
    const { data: booking, error: bookingErr } = await db
      .from("bookings")
      .select("total, status, payment_status, mpesa_checkout_request_id")
      .eq("id", bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }
    if (booking.payment_status === "paid") {
      return NextResponse.json({ error: "This booking has already been paid." }, { status: 409 });
    }
    if (booking.payment_status === "pending" && booking.mpesa_checkout_request_id) {
      return NextResponse.json(
        { error: "An M-Pesa prompt is already pending for this booking." },
        { status: 409 }
      );
    }
    if (booking.status === "cancelled" || booking.status === "completed") {
      return NextResponse.json(
        { error: "This booking is no longer payable." },
        { status: 409 }
      );
    }

    const amount = Math.round(Number(booking.total));
    if (!Number.isFinite(amount) || amount < 1) {
      return NextResponse.json({ error: "Invalid booking amount." }, { status: 422 });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${config.shortcode}${config.passkey}${timestamp}`).toString("base64");

    const token = await getMpesaToken(config);

    const stkRes = await fetch(`${config.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: config.shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrlWithSecret(config),
        AccountReference: bookingId,
        TransactionDesc: "StayNest booking"
      })
    });

    const stkJson = await stkRes.json();
    if (!stkRes.ok) {
      throw new Error(stkJson.errorMessage ?? `M-Pesa STK request failed: ${stkRes.status}`);
    }

    if (stkJson.ResponseCode !== "0") {
      return NextResponse.json(
        { error: stkJson.ResponseDescription ?? "STK push failed" },
        { status: 400 }
      );
    }

    const checkoutRequestId: string = stkJson.CheckoutRequestID;
    if (!checkoutRequestId || typeof checkoutRequestId !== "string") {
      throw new Error("M-Pesa did not return a checkout request id.");
    }

    // Save checkout request ID so the callback can find this booking
    const { error: updateErr } = await db
      .from("bookings")
      .update({
        mpesa_checkout_request_id: checkoutRequestId,
        payment_status: "pending"
      })
      .eq("id", bookingId);
    if (updateErr) throw updateErr;

    return NextResponse.json({ checkoutRequestId });
  } catch (err: any) {
    console.error("stk-push error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
