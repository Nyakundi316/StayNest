import { supabase } from "./supabase";
import { Owner, Property, Booking, Inquiry, Review, ListingType } from "./types";

// ---- Row mappers (snake_case → camelCase) ----

function mapProperty(r: any): Property {
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
    ownerId: r.owner_id,
    createdAt: r.created_at
  };
}

function mapOwner(r: any): Owner {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email ?? undefined,
    payoutMethod: r.payout_method ?? undefined
  };
}

function mapBooking(r: any): Booking {
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

function mapInquiry(r: any): Inquiry {
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

function mapReview(r: any): Review {
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

// ---- Reads ----

export async function getProperties(filter?: { listingType?: ListingType }): Promise<Property[]> {
  let q = supabase.from("properties").select("*").order("created_at", { ascending: true });
  if (filter?.listingType) q = q.eq("listing_type", filter.listingType);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapProperty);
}

export async function getProperty(id: string): Promise<Property | null> {
  const { data, error } = await supabase
    .from("properties").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProperty(data) : null;
}

export async function getOwners(): Promise<Owner[]> {
  const { data, error } = await supabase
    .from("owners").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapOwner);
}

export async function getOwner(id: string): Promise<Owner | null> {
  const { data, error } = await supabase
    .from("owners").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapOwner(data) : null;
}

export async function getBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBooking);
}

export async function getInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapInquiry);
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

export async function similarProperties(id: string, limit = 4): Promise<Property[]> {
  const target = await getProperty(id);
  if (!target) return [];
  const { data } = await supabase
    .from("properties").select("*")
    .neq("id", id)
    .eq("listing_type", target.listingType);
  return (data ?? [])
    .map(mapProperty)
    .filter((p) => p.type === target.type || p.city === target.city)
    .slice(0, limit);
}

// ---- Writes ----

export async function createProperty(input: {
  name: string;
  location: string;
  city: string;
  type: Property["type"];
  listingType: ListingType;
  description: string;
  bedrooms: number;
  bathrooms: number;
  guests: number;
  // Per-listing-type pricing
  ownerBasePrice?: number;
  markup?: number;
  salePrice?: number;
  saleMarkup?: number;
  monthlyRent?: number;
  leaseMarkup?: number;
  leaseTermMonths?: number;
  amenities: string[];
  rules?: string[];
  images?: string[];
  available?: boolean;
  ownerId: string;
}): Promise<Property> {
  const row: any = {
    name: input.name,
    location: input.location,
    city: input.city,
    type: input.type,
    listing_type: input.listingType,
    description: input.description,
    images: input.images ?? [],
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    guests: input.guests,
    amenities: input.amenities,
    rules: input.rules ?? [],
    available: input.available ?? true,
    owner_id: input.ownerId
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

  const { data, error } = await supabase
    .from("properties").insert(row).select("*").single();
  if (error) throw error;
  return mapProperty(data);
}

export async function upsertOwner(input: {
  name: string;
  phone: string;
  email?: string;
  payoutMethod?: Owner["payoutMethod"];
}): Promise<Owner> {
  const { data: existing } = await supabase
    .from("owners").select("*").eq("phone", input.phone).maybeSingle();
  if (existing) return mapOwner(existing);

  const { data, error } = await supabase
    .from("owners").insert({
      name: input.name,
      phone: input.phone,
      email: input.email ?? null,
      payout_method: input.payoutMethod ?? null
    }).select("*").single();
  if (error) throw error;
  return mapOwner(data);
}

export async function createBooking(input: {
  propertyId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  pricePerNight: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  ownerPayout: number;
  agentProfit: number;
}): Promise<Booking> {
  const { data, error } = await supabase
    .from("bookings").insert({
      property_id: input.propertyId,
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      guest_phone: input.guestPhone,
      check_in: input.checkIn,
      check_out: input.checkOut,
      guests: input.guests,
      nights: input.nights,
      price_per_night: input.pricePerNight,
      subtotal: input.subtotal,
      service_fee: input.serviceFee,
      total: input.total,
      owner_payout: input.ownerPayout,
      agent_profit: input.agentProfit,
      status: "pending"
    }).select("*").single();
  if (error) throw error;
  return mapBooking(data);
}

export async function createInquiry(input: {
  propertyId: string;
  kind: Inquiry["kind"];
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  preferredDate?: string;
  offerAmount?: number;
  moveInDate?: string;
  leaseTermMonths?: number;
  message?: string;
}): Promise<Inquiry> {
  const { data, error } = await supabase
    .from("inquiries").insert({
      property_id: input.propertyId,
      kind: input.kind,
      guest_name: input.guestName,
      guest_email: input.guestEmail,
      guest_phone: input.guestPhone,
      preferred_date: input.preferredDate ?? null,
      offer_amount: input.offerAmount ?? null,
      move_in_date: input.moveInDate ?? null,
      lease_term_months: input.leaseTermMonths ?? null,
      message: input.message ?? null
    }).select("*").single();
  if (error) throw error;
  return mapInquiry(data);
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
