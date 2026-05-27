import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";
import { mapProperty } from "@/lib/data";
import { emailRestockAvailable } from "@/lib/email";
import type { ListingType, PropertyType } from "@/lib/types";

interface OwnerInput {
  name: string;
  phone: string;
  email?: string;
  payoutMethod?: "M-Pesa" | "Bank" | "Cash";
}

interface PropertyInput {
  name: string;
  location: string;
  city: string;
  type: PropertyType;
  listingType: ListingType;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  ownerBasePrice?: number;
  markup?: number;
  salePrice?: number;
  saleMarkup?: number;
  monthlyRent?: number;
  leaseMarkup?: number;
  leaseTermMonths?: number;
  amenities?: string[];
  rules?: string[];
  images?: string[];
  available?: boolean;
}

// Reuse an owner with the same phone, else create one. Service-role only.
async function upsertOwner(db: ReturnType<typeof createServerClient>, input: OwnerInput) {
  const { data: existing } = await db
    .from("owners").select("*").eq("phone", input.phone).maybeSingle();
  if (existing) return existing;

  const { data, error } = await db
    .from("owners")
    .insert({
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      payout_method: input.payoutMethod ?? null
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function notifyRestockSubscribers(
  db: ReturnType<typeof createServerClient>,
  propertyId: string,
  propertyName: string
) {
  const { data: subscribers, error } = await db
    .from("restock_subscriptions")
    .select("id,email")
    .eq("property_id", propertyId)
    .eq("status", "active");

  if (error) throw error;
  if (!subscribers?.length) return;

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://staynest.co.ke").replace(/\/$/, "");
  const propertyUrl = `${appUrl}/listings/${propertyId}`;

  await Promise.allSettled(
    subscribers.map((sub) =>
      emailRestockAvailable({
        email: sub.email,
        propertyName,
        propertyUrl
      })
    )
  );

  await db
    .from("restock_subscriptions")
    .update({
      status: "notified",
      notified_at: new Date().toISOString()
    })
    .in("id", subscribers.map((sub) => sub.id));
}

function propertyRow(input: PropertyInput, ownerId: string) {
  const row: Record<string, unknown> = {
    name: input.name,
    location: input.location,
    city: input.city,
    type: input.type,
    listing_type: input.listingType,
    description: input.description ?? "",
    images: input.images ?? [],
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    guests: input.guests,
    amenities: input.amenities ?? [],
    rules: input.rules ?? [],
    available: input.available ?? true,
    owner_id: ownerId
  };
  if (input.listingType === "short_stay") {
    row.owner_base_price = input.ownerBasePrice;
    row.markup = input.markup ?? 0;
  } else if (input.listingType === "sale") {
    row.sale_price = input.salePrice;
    row.sale_markup = input.saleMarkup ?? 0;
  } else if (input.listingType === "lease") {
    row.monthly_rent = input.monthlyRent;
    row.lease_markup = input.leaseMarkup ?? 0;
    row.lease_term_months = input.leaseTermMonths ?? null;
  }
  return row;
}

// ---- Create: upsert owner + insert property ----
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { owner, property } = (await req.json()) as {
      owner: OwnerInput;
      property: PropertyInput;
    };

    if (!owner?.name || !owner?.phone) {
      return NextResponse.json({ error: "Owner name and phone are required." }, { status: 400 });
    }
    if (!property?.name || !property?.location) {
      return NextResponse.json({ error: "Property name and location are required." }, { status: 400 });
    }

    const db = createServerClient();
    const ownerRow = await upsertOwner(db, owner);

    const { data, error } = await db
      .from("properties")
      .insert(propertyRow(property, ownerRow.id))
      .select("*")
      .single();
    if (error) throw error;

    return NextResponse.json({ property: mapProperty(data) });
  } catch (err: any) {
    console.error("admin/property POST error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to create property" }, { status: 500 });
  }
}

// ---- Update an existing property ----
export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id, owner, property } = (await req.json()) as {
      id: string;
      owner?: OwnerInput;
      property: PropertyInput;
    };
    if (!id) return NextResponse.json({ error: "Property id is required." }, { status: 400 });

    const db = createServerClient();
    const { data: current, error: fetchErr } = await db
      .from("properties").select("owner_id, available").eq("id", id).maybeSingle();
    if (fetchErr || !current) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    let ownerId = current.owner_id;
    if (owner?.name && owner?.phone) {
      const ownerRow = await upsertOwner(db, owner);
      ownerId = ownerRow.id;
    }

    const { data, error } = await db
      .from("properties")
      .update(propertyRow(property, ownerId))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    if (!current.available && data.available) {
      await notifyRestockSubscribers(db, id, data.name);
    }

    return NextResponse.json({ property: mapProperty(data) });
  } catch (err: any) {
    console.error("admin/property PUT error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to update property" }, { status: 500 });
  }
}

// ---- Archive / unarchive (soft delete) ----
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  try {
    const { id, archived } = (await req.json()) as { id: string; archived: boolean };
    if (!id) return NextResponse.json({ error: "Property id is required." }, { status: 400 });

    const db = createServerClient();
    const { error } = await db
      .from("properties")
      .update({ archived: Boolean(archived) })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("admin/property PATCH error:", err);
    return NextResponse.json({ error: err.message ?? "Failed to archive property" }, { status: 500 });
  }
}
