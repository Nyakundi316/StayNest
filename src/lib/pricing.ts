import { Property, Booking } from "./types";

export const SERVICE_FEE_RATE = 0.05; // 5% client-facing service fee

/**
 * Final per-night price the CLIENT sees.
 * Owner price + agent markup. Service fee is added at checkout.
 */
export function clientPricePerNight(p: Pick<Property, "ownerBasePrice" | "markup">) {
  return p.ownerBasePrice + p.markup;
}

/**
 * Build a price breakdown for a booking.
 * Internal numbers (owner payout, agent profit) are never sent to client UI.
 */
export function buildPriceBreakdown(p: Property, nights: number) {
  const perNight = clientPricePerNight(p);
  const subtotal = perNight * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = subtotal + serviceFee;
  const agentProfit = p.markup * nights;
  const ownerPayout = p.ownerBasePrice * nights;

  return {
    perNight,
    nights,
    subtotal,
    serviceFee,
    total,
    agentProfit,
    ownerPayout
  };
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export function formatKsh(n: number): string {
  if (Number.isNaN(n)) return "KSH 0";
  return "KSH " + n.toLocaleString("en-KE");
}

/**
 * Aggregate dashboard numbers for the agent/admin view.
 */
export function aggregate(bookings: Booking[]) {
  const totals = bookings.reduce(
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
    {
      totalBookings: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      gross: 0,
      payouts: 0,
      profit: 0
    }
  );
  return totals;
}
