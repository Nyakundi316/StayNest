import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const VALID: Record<string, string[]> = {
  new: ["contacted", "closed"],
  contacted: ["closed"],
  closed: []
};

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const { status } = await req.json();
    const db = createServerClient();

    const { data: inquiry, error: fetchErr } = await db
      .from("inquiries")
      .select("status")
      .eq("id", id)
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

    await db.from("inquiries").update({ status }).eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("inquiry status error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
