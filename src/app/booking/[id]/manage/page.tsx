import Link from "next/link";
import { Calendar, MapPin, ShieldAlert } from "lucide-react";
import { createServerClient } from "@/lib/supabase-server";
import { verifyBookingAccessToken } from "@/lib/booking-access";
import { formatKsh } from "@/lib/pricing";
import ManageBookingActions from "./ManageBookingActions";

type SearchParams = Promise<{ token?: string }>;
type RouteParams = Promise<{ id: string }>;

const STATUS_TONE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-ink-100 text-ink-700 ring-ink-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200"
};

export default async function ManageBookingPage({
  params, searchParams
}: { params: RouteParams; searchParams: SearchParams }) {
  const { id } = await params;
  const { token } = await searchParams;

  const payload = await verifyBookingAccessToken(token ?? null, id);
  if (!payload) return <Invalid reason="link" />;

  const db = createServerClient();
  const { data: booking, error } = await db
    .from("bookings")
    .select(`
      id, status, payment_status, check_in, check_out, nights, guests,
      total, guest_name, guest_email, mpesa_receipt_number,
      cancelled_at, cancellation_reason,
      property:properties (id, name, location, city, images, type)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !booking) return <Invalid reason="booking" />;
  if (String(booking.guest_email).toLowerCase() !== payload.email.toLowerCase()) {
    return <Invalid reason="mismatch" />;
  }

  const tone = STATUS_TONE[booking.status] ?? STATUS_TONE.pending;
  const property = Array.isArray(booking.property) ? booking.property[0] : booking.property;
  const img = property?.images?.[0];

  return (
    <div className="pt-24 pb-20 container-px max-w-2xl">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-600 mb-1">
          Manage booking
        </div>
        <h1 className="h-display text-3xl">{property?.name ?? "Your booking"}</h1>
        <p className="text-sm text-ink-500 mt-1.5">
          Signed in via your private email link as {payload.email}.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex gap-4">
          {img ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={img} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-ink-100 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-semibold truncate">{property?.name ?? "Property"}</h2>
              <span className={`text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ring-1 ${tone}`}>
                {booking.status}
              </span>
            </div>
            <div className="text-sm text-ink-500 flex items-center gap-1.5 mt-0.5">
              <MapPin size={12} /> {property?.location ?? ""}
            </div>
            <div className="text-sm text-ink-600 flex items-center gap-1.5 mt-2">
              <Calendar size={12} className="text-brand-500" />
              {booking.check_in} → {booking.check_out} · {booking.nights} night{booking.nights !== 1 ? "s" : ""}
            </div>
            <div className="text-sm font-semibold mt-1">{formatKsh(booking.total)}</div>
            {booking.payment_status === "paid" && booking.mpesa_receipt_number && (
              <div className="text-xs text-ink-500 mt-1">
                M-Pesa receipt:{" "}
                <span className="font-mono font-semibold text-ink-700">
                  {booking.mpesa_receipt_number}
                </span>
              </div>
            )}
          </div>
        </div>

        {booking.status === "cancelled" && booking.cancellation_reason && (
          <p className="mt-4 text-sm text-ink-500 italic">
            Cancellation: {booking.cancellation_reason}
          </p>
        )}

        <ManageBookingActions
          bookingId={booking.id}
          checkIn={booking.check_in}
          propertyName={property?.name ?? "your booking"}
          status={booking.status}
          token={token ?? ""}
        />
      </div>

      <div className="mt-6 text-xs text-ink-500">
        Lost this link? Contact us at +254 708 781 407 and we&apos;ll resend it.
      </div>
    </div>
  );
}

function Invalid({ reason }: { reason: "link" | "booking" | "mismatch" }) {
  const headline = {
    link: "This link has expired or is invalid.",
    booking: "We couldn't find that booking.",
    mismatch: "This link doesn't match the booking on file."
  }[reason];
  return (
    <div className="pt-32 pb-20 container-px max-w-md text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 grid place-items-center mb-4">
        <ShieldAlert size={22} />
      </div>
      <h1 className="h-display text-2xl mb-2">Can&apos;t open this booking</h1>
      <p className="text-sm text-ink-500">{headline}</p>
      <p className="text-sm text-ink-500 mt-1">
        Request a fresh link with the email you booked with, or reach out at +254 708 781 407.
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        <Link href="/booking/find" className="btn-primary px-5 py-2.5 text-sm">
          Find my booking
        </Link>
        <Link href="/" className="btn-secondary px-5 py-2.5 text-sm">
          Back home
        </Link>
      </div>
    </div>
  );
}
