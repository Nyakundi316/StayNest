import { NextRequest, NextResponse } from "next/server";
import { emailContactForm } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Lands straight in the agent inbox — keep this the tightest of the lot.
    const limited = await enforceRateLimit(req, { key: "contact", max: 3, windowSec: 600 });
    if (limited) return limited;

    const { name, email, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
    }

    await emailContactForm({ name, email, subject: subject ?? "", message });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("contact route error:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
