import { Property, Booking, ListingType } from "./types";

export const SERVICE_FEE_RATE = 0.05;

// ---- Short stay (per night) ----

export function clientPricePerNight(p: Pick<Property, "ownerBasePrice" | "markup">) {
  return (p.ownerBasePrice ?? 0) + (p.markup ?? 0);
}

export function buildPriceBreakdown(p: Property, nights: number) {
  const perNight = clientPricePerNight(p);
  const subtotal = perNight * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;
  const agentProfit = (p.markup ?? 0) * nights;
  const ownerPayout = (p.ownerBasePrice ?? 0) * nights;
  return { perNight, nights, subtotal, serviceFee, total, agentProfit, ownerPayout };
}

// ---- Sale ----

export function clientSalePrice(p: Pick<Property, "salePrice" | "saleMarkup">) {
  return (p.salePrice ?? 0) + (p.saleMarkup ?? 0);
}

// ---- Lease (monthly) ----

export function clientMonthlyRent(p: Pick<Property, "monthlyRent" | "leaseMarkup">) {
  return (p.monthlyRent ?? 0) + (p.leaseMarkup ?? 0);
}

// ---- Generic: what's the headline price the client sees, and in what unit? ----

export function clientPriceFor(p: Property): { amount: number; unit: string } {
  switch (p.listingType) {
    case "sale":
      return { amount: clientSalePrice(p), unit: "" };
    case "lease":
      return { amount: clientMonthlyRent(p), unit: "/month" };
    case "short_stay":
    default:
      return { amount: clientPricePerNight(p), unit: "/night" };
  }
}

// ---- Helpers ----

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export function formatKsh(n: number): string {
  if (Number.isNaN(n)) return "KSH 0";
  return "KSH " + Math.round(n).toLocaleString("en-KE");
}

/** Compact format for big sale prices: 29,500,000 → "KSH 29.5M". */
export function formatKshCompact(n: number): string {
  if (Number.isNaN(n)) return "KSH 0";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `KSH ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `KSH ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return formatKsh(n);
}

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  short_stay: "Short stay",
  sale: "For sale",
  lease: "For lease"
};

// ---- Aggregation for the admin dashboard ----

export function aggregate(bookings: Booking[]) {
  return bookings.reduce(
    (acc, b) => {
      acc.totalBookings += 1;
      if (b.status === "pending") acc.pending += 1;
      if (b.status === "confirmed") acc.confirmed += 1;
      if (b.status === "completed") acc.completed += 1;
      acc.gross += b.total;
      acc.payouts += b.ownerPayout;
      acc.profit += b.agentProfit;
      return acc;
    },
    { totalBookings: 0, pending: 0, confirmed: 0, completed: 0, gross: 0, payouts: 0, profit: 0 }
  );
}

/**
 * Potential profit if every for-sale property sells and every lease fills
 * for one full term. Useful KPI for the agent dashboard.
 */
export function potentialPipeline(props: Property[]) {
  let saleProfit = 0;
  let saleListings = 0;
  let leaseMonthlyProfit = 0;
  let leaseListings = 0;

  for (const p of props) {
    if (p.listingType === "sale") {
      saleProfit += p.saleMarkup ?? 0;
      saleListings += 1;
    }
    if (p.listingType === "lease") {
      leaseMonthlyProfit += p.leaseMarkup ?? 0;
      leaseListings += 1;
    }
  }
  return { saleProfit, saleListings, leaseMonthlyProfit, leaseListings };
}
