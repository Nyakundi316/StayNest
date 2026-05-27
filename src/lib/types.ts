// Core domain types for StayNest.
// Designed so the same shape works against Supabase rows.

export type PropertyType =
  | "Studio"
  | "Apartment"
  | "House"
  | "Villa"
  | "Room";

export type ListingType = "short_stay" | "sale" | "lease";

export interface Owner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  payoutMethod?: "M-Pesa" | "Bank" | "Cash";
}

export interface Property {
  id: string;
  name: string;
  location: string;
  city: string;
  type: PropertyType;
  listingType: ListingType;
  description: string;
  images: string[];

  bedrooms: number;
  bathrooms: number;
  guests: number;

  // ---- Pricing - INTERNAL FIELDS (never expose to client UI) ----
  // Short stay
  ownerBasePrice?: number | null;     // per-night
  markup?: number | null;              // per-night markup
  // For sale
  salePrice?: number | null;           // owner's asking price
  saleMarkup?: number | null;          // your markup on the sale
  // For lease
  monthlyRent?: number | null;         // owner's monthly rent
  leaseMarkup?: number | null;         // your markup on the monthly rent
  leaseTermMonths?: number | null;

  amenities: string[];
  rules?: string[];
  rating: number;
  reviews: number;
  available: boolean;
  archived?: boolean;

  ownerId: string;
  createdAt: string;
}

export interface Booking {
  id: string;
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
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  mpesaCheckoutRequestId?: string | null;
  mpesaReceiptNumber?: string | null;
  createdAt: string;
}

export type InquiryKind = "viewing" | "offer" | "lease_application";

export interface Inquiry {
  id: string;
  propertyId: string;
  kind: InquiryKind;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  preferredDate?: string | null;
  offerAmount?: number | null;
  moveInDate?: string | null;
  leaseTermMonths?: number | null;
  message?: string | null;
  status: "new" | "contacted" | "closed";
  createdAt: string;
}

export interface Review {
  id: string;
  propertyId: string;
  bookingId: string | null;
  guestName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface RestockSubscription {
  id: string;
  propertyId: string;
  email: string;
  status: "active" | "notified" | "cancelled";
  notifiedAt?: string | null;
  createdAt: string;
}

export interface RecentView {
  id: string;
  propertyId: string;
  guestId?: string | null;
  userId?: string | null;
  viewedAt: string;
}

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  type?: PropertyType | "All";
  listingType?: ListingType | "All";
  minPrice?: number;
  maxPrice?: number;
}
