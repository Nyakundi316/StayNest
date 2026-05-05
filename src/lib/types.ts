// Core domain types for StayNest.
// Designed so the same shape will work when we move from mock data to Supabase.

export type PropertyType =
  | "Studio"
  | "Apartment"
  | "House"
  | "Villa"
  | "Room";

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
  description: string;
  images: string[];

  // Capacity
  bedrooms: number;
  bathrooms: number;
  guests: number;

  // Pricing - INTERNAL FIELDS (never expose to client UI)
  ownerBasePrice: number; // What the owner charges us
  markup: number;          // Our profit per night

  // Public fields
  amenities: string[];
  rules?: string[];
  rating: number;
  reviews: number;
  available: boolean;

  // Relations
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

  // Money
  pricePerNight: number;     // Final client price per night
  subtotal: number;          // pricePerNight * nights
  serviceFee: number;
  total: number;             // What client pays
  ownerPayout: number;       // total - markup*nights - serviceFee
  agentProfit: number;       // markup * nights

  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  type?: PropertyType | "All";
  minPrice?: number;
  maxPrice?: number;
}
