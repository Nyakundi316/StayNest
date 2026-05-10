import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const MPESA_ENV = process.env.MPESA_ENV ?? "sandbox";
const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  return "254" + digits;
}

async function getMpesaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }
  });
  if (!res.ok) throw new Error(`M-Pesa auth failed: ${res.status}`);
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  // Guard: if credentials aren't configured, tell the client to skip to manual flow
  if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_SHORTCODE) {
    return NextResponse.json({ unconfigured: true }, { status: 200 });
  }

  try {
    const { bookingId, phone, amount } = await req.json();
    if (!bookingId || !phone || !amount) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const callbackUrl = process.env.MPESA_CALLBACK_URL!;

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const normalizedPhone = normalizePhone(phone);

    const token = await getMpesaToken();

    const stkRes = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(amount),
        PartyA: normalizedPhone,
        PartyB: shortcode,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: bookingId,
        TransactionDesc: "StayNest booking"
      })
    });

    const stkJson = await stkRes.json();

    if (stkJson.ResponseCode !== "0") {
      return NextResponse.json(
        { error: stkJson.ResponseDescription ?? "STK push failed" },
        { status: 400 }
      );
    }

    const checkoutRequestId: string = stkJson.CheckoutRequestID;

    // Save checkout request ID so the callback can find this booking
    const db = createServerClient();
    await db
      .from("bookings")
      .update({
        mpesa_checkout_request_id: checkoutRequestId,
        payment_status: "pending"
      })
      .eq("id", bookingId);

    return NextResponse.json({ checkoutRequestId });
  } catch (err: any) {
    console.error("stk-push error:", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
