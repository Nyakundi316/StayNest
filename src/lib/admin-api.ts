// Client-side helpers for the protected /api/admin/* routes. Every call
// carries the admin Supabase session token (validated server-side by
// requireAdmin), so these never expose owner economics to the public.

import { authHeaders } from "./supabase-auth";
import type {
  Owner,
  Property,
  Booking,
  Inquiry,
  ListingType,
  PropertyType,
  RestockSubscription
} from "./types";

async function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...(init.headers ?? {})
    }
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Request failed");
  return body as T;
}

export interface AdminOverview {
  properties: Property[];
  owners: Owner[];
  bookings: Booking[];
  inquiries: Inquiry[];
  restockSubscriptions: RestockSubscription[];
}

export function fetchAdminOverview(): Promise<AdminOverview> {
  return adminFetch<AdminOverview>("/api/admin/overview");
}

export interface OwnerInput {
  name: string;
  phone: string;
  email?: string;
  payoutMethod?: "M-Pesa" | "Bank" | "Cash";
}

export interface PropertyInput {
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

export function createProperty(
  owner: OwnerInput,
  property: PropertyInput
): Promise<{ property: Property }> {
  return adminFetch("/api/admin/property", {
    method: "POST",
    body: JSON.stringify({ owner, property })
  });
}

export function updateProperty(
  id: string,
  owner: OwnerInput,
  property: PropertyInput
): Promise<{ property: Property }> {
  return adminFetch("/api/admin/property", {
    method: "PUT",
    body: JSON.stringify({ id, owner, property })
  });
}

export function setPropertyArchived(id: string, archived: boolean): Promise<{ ok: true }> {
  return adminFetch("/api/admin/property", {
    method: "PATCH",
    body: JSON.stringify({ id, archived })
  });
}

export async function downloadAdminCsv(kind: "bookings" | "guests" | "listings" | "availability") {
  const res = await fetch(`/api/admin/export/${kind}`, {
    headers: await authHeaders()
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Export failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `staynest-${kind}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
