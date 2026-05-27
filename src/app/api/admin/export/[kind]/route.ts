import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

const EXPORTS = new Set(["bookings", "guests", "listings", "availability"]);

function csvEscape(value: unknown): string {
  const raw = value == null ? "" : String(value);
  return /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(","))
  ].join("\n");
}

function csvResponse(kind: string, csv: string) {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="staynest-${kind}-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string }> }
) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { kind } = await params;
  if (!EXPORTS.has(kind)) {
    return NextResponse.json({ error: "Unknown export type." }, { status: 404 });
  }

  try {
    const db = createServerClient();

    if (kind === "bookings") {
      const { data, error } = await db
        .from("bookings")
        .select("id,guest_name,guest_email,guest_phone,check_in,check_out,nights,total,status,payment_status,mpesa_receipt_number,property_id,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const propertyIds = [...new Set((data ?? []).map((r) => r.property_id).filter(Boolean))];
      const { data: props } = propertyIds.length
        ? await db.from("properties").select("id,name").in("id", propertyIds)
        : { data: [] };
      const names = new Map((props ?? []).map((p) => [p.id, p.name]));

      return csvResponse(kind, toCsv(
        ["id", "property", "guest_name", "guest_email", "guest_phone", "check_in", "check_out", "nights", "total", "status", "payment_status", "mpesa_receipt", "created_at"],
        (data ?? []).map((r) => [
          r.id, names.get(r.property_id) ?? "", r.guest_name, r.guest_email, r.guest_phone,
          r.check_in, r.check_out, r.nights, r.total, r.status, r.payment_status,
          r.mpesa_receipt_number, r.created_at
        ])
      ));
    }

    if (kind === "guests") {
      const [bookings, inquiries] = await Promise.all([
        db.from("bookings").select("guest_name,guest_email,guest_phone,total,created_at"),
        db.from("inquiries").select("guest_name,guest_email,guest_phone,created_at")
      ]);
      if (bookings.error || inquiries.error) throw bookings.error ?? inquiries.error;

      const customers = new Map<string, {
        name: string;
        email: string;
        phone: string;
        bookings: number;
        inquiries: number;
        lifetimeValue: number;
        firstSeen: string;
        lastSeen: string;
      }>();

      for (const b of bookings.data ?? []) {
        const key = String(b.guest_email).toLowerCase();
        const current = customers.get(key) ?? {
          name: b.guest_name,
          email: key,
          phone: b.guest_phone,
          bookings: 0,
          inquiries: 0,
          lifetimeValue: 0,
          firstSeen: b.created_at,
          lastSeen: b.created_at
        };
        current.bookings += 1;
        current.lifetimeValue += Number(b.total ?? 0);
        current.firstSeen = current.firstSeen < b.created_at ? current.firstSeen : b.created_at;
        current.lastSeen = current.lastSeen > b.created_at ? current.lastSeen : b.created_at;
        customers.set(key, current);
      }

      for (const i of inquiries.data ?? []) {
        const key = String(i.guest_email).toLowerCase();
        const current = customers.get(key) ?? {
          name: i.guest_name,
          email: key,
          phone: i.guest_phone,
          bookings: 0,
          inquiries: 0,
          lifetimeValue: 0,
          firstSeen: i.created_at,
          lastSeen: i.created_at
        };
        current.inquiries += 1;
        current.firstSeen = current.firstSeen < i.created_at ? current.firstSeen : i.created_at;
        current.lastSeen = current.lastSeen > i.created_at ? current.lastSeen : i.created_at;
        customers.set(key, current);
      }

      return csvResponse(kind, toCsv(
        ["name", "email", "phone", "bookings", "inquiries", "lifetime_value", "first_seen", "last_seen"],
        [...customers.values()].map((c) => [
          c.name, c.email, c.phone, c.bookings, c.inquiries, c.lifetimeValue, c.firstSeen, c.lastSeen
        ])
      ));
    }

    const { data, error } = await db
      .from("properties")
      .select("id,name,city,location,type,listing_type,available,archived,bedrooms,bathrooms,guests,owner_base_price,markup,sale_price,sale_markup,monthly_rent,lease_markup,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    if (kind === "listings") {
      return csvResponse(kind, toCsv(
        ["id", "name", "listing_type", "type", "city", "location", "client_price", "available", "archived", "created_at"],
        (data ?? []).map((p) => {
          const clientPrice =
            p.listing_type === "sale"
              ? Number(p.sale_price ?? 0) + Number(p.sale_markup ?? 0)
              : p.listing_type === "lease"
                ? Number(p.monthly_rent ?? 0) + Number(p.lease_markup ?? 0)
                : Number(p.owner_base_price ?? 0) + Number(p.markup ?? 0);
          return [
            p.id, p.name, p.listing_type, p.type, p.city, p.location,
            clientPrice, p.available, p.archived, p.created_at
          ];
        })
      ));
    }

    return csvResponse(kind, toCsv(
      ["id", "name", "listing_type", "available", "archived", "bedrooms", "bathrooms", "guest_capacity", "status"],
      (data ?? []).map((p) => [
        p.id, p.name, p.listing_type, p.available, p.archived,
        p.bedrooms, p.bathrooms, p.guests,
        p.archived ? "archived" : p.available ? "available" : "unavailable"
      ])
    ));
  } catch (err: any) {
    console.error("admin export error:", err);
    return NextResponse.json(
      { error: err.message ?? "Export failed." },
      { status: 500 }
    );
  }
}
