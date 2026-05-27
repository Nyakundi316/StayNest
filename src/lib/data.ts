import { supabase } from "./supabase";
import {
  Owner,
  Property,
  Booking,
  Inquiry,
  Review,
  ListingType,
  RestockSubscription
} from "./types";

// ---- Row mappers (snake_case → camelCase) ----
// Exported so the admin API routes (service role) reuse the same shapes.

export function mapProperty(r: any): Property {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    city: r.city,
    type: r.type,
    listingType: (r.listing_type ?? "short_stay") as ListingType,
    description: r.description ?? "",
    images: Array.isArray(r.images) ? r.images : [],
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    guests: r.guests,
    ownerBasePrice: r.owner_base_price ?? null,
    markup: r.markup ?? null,
    salePrice: r.sale_price ?? null,
    saleMarkup: r.sale_markup ?? null,
    monthlyRent: r.monthly_rent ?? null,
    leaseMarkup: r.lease_markup ?? null,
    leaseTermMonths: r.lease_term_months ?? null,
    amenities: r.amenities ?? [],
    rules: r.rules ?? [],
    rating: Number(r.rating ?? 0),
    reviews: r.reviews ?? 0,
    available: r.available,
    archived: Boolean(r.archived ?? false),
    ownerId: r.owner_id ?? "",
    createdAt: r.created_at
  };
}

export function mapOwner(r: any): Owner {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? undefined,
    payoutMethod: r.payout_method ?? undefined
  };
}

export function mapBooking(r: any): Booking {
  return {
    id: r.id,
    propertyId: r.property_id,
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    guestPhone: r.guest_phone,
    checkIn: r.check_in,
    checkOut: r.check_out,
    guests: r.guests,
    nights: r.nights,
    pricePerNight: r.price_per_night,
    subtotal: r.subtotal,
    serviceFee: r.service_fee,
    total: r.total,
    ownerPayout: r.owner_payout,
    agentProfit: r.agent_profit,
    status: r.status,
    paymentStatus: (r.payment_status ?? "unpaid") as Booking["paymentStatus"],
    mpesaCheckoutRequestId: r.mpesa_checkout_request_id ?? null,
    mpesaReceiptNumber: r.mpesa_receipt_number ?? null,
    createdAt: r.created_at
  };
}

export function mapInquiry(r: any): Inquiry {
  return {
    id: r.id,
    propertyId: r.property_id,
    kind: r.kind,
    guestName: r.guest_name,
    guestEmail: r.guest_email,
    guestPhone: r.guest_phone,
    preferredDate: r.preferred_date,
    offerAmount: r.offer_amount,
    moveInDate: r.move_in_date,
    leaseTermMonths: r.lease_term_months,
    message: r.message,
    status: r.status,
    createdAt: r.created_at
  };
}

export function mapReview(r: any): Review {
  return {
    id: r.id,
    propertyId: r.property_id,
    bookingId: r.booking_id ?? null,
    guestName: r.guest_name,
    rating: r.rating,
    comment: r.comment ?? null,
    createdAt: r.created_at
  };
}

export function mapRestockSubscription(r: any): RestockSubscription {
  return {
    id: r.id,
    propertyId: r.property_id,
    email: r.email,
    status: r.status,
    notifiedAt: r.notified_at ?? null,
    createdAt: r.created_at
  };
}

// ---- Public reads ----
// These run with the anon key in the browser. They read from the
// `properties_public` view (see migration 0003), which collapses owner
// price + markup into a single client-facing price and hides owner_id,
// payout and profit. Raw `properties`/`owners`/`bookings` are no longer
// readable by the anon key — that data is admin-only via /api/admin/*.

export async function getProperties(filter?: { listingType?: ListingType }): Promise<Property[]> {
  let q = supabase
    .from("properties_public")
    .select("*")
    .order("created_at", { ascending: true });
  if (filter?.listingType) q = q.eq("listing_type", filter.listingType);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapProperty);
}

export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties_public").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProperty(data) : null;
}

export async function similarProperties(id: string, limit = 4): Promise<Property[]> {
  const target = await getProperty(id);
  if (!target) return [];
  const { data } = await supabase
    .from("properties_public").select("*")
    .neq("id", id)
    .eq("listing_type", target.listingType);
  return (data ?? [])
    .map(mapProperty)
    .filter((p) => p.type === target.type || p.city === target.city)
    .slice(0, limit);
}

export async function getReviews(propertyId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapReview);
}

// ---- Static (not in DB) ----

export const popularLocations = [
  { name: "Nairobi",  image: "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=900", count: 4 },
  { name: "Diani",    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900", count: 1 },
  { name: "Mombasa",  image: "https://images.unsplash.com/photo-1571406761758-9a3eed5338ef?w=900", count: 1 },
  { name: "Naivasha", image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=900", count: 1 },
  { name: "Lamu",     image: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=900", count: 1 },
  { name: "Nanyuki",  image: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=900", count: 1 }
];
