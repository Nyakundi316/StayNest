import { NextRequest, NextResponse } from "next/server";
import { emailContactForm } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
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
