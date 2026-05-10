import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const VALID: Record<string, string[]> = {
  new: ["contacted", "closed"],
  contacted: ["closed"],
  closed: []
};

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    const db = createServerClient();

    const { data: inquiry, error: fetchErr } = await db
      .from("inquiries")
      .select("status")
      .eq("id", params.id)
      .single();

    if (fetchErr || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const allowed = VALID[inquiry.status] ?? [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${inquiry.status} → ${status}` },
        { status: 400 }
      );
    }

    await db.from("inquiries").update({ status }).eq("id", params.id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("inquiry status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
