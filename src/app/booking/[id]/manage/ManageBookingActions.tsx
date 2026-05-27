"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import CancelBookingModal from "@/components/CancelBookingModal";

const CANCELLABLE = new Set(["pending", "confirmed"]);

export default function ManageBookingActions({
  bookingId, checkIn, propertyName, status, token
}: {
  bookingId: string;
  checkIn: string;
  propertyName: string;
  status: string;
  token: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!CANCELLABLE.has(status)) return null;

  return (
    <div className="mt-5 flex items-center justify-end">
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1.5"
      >
        <XCircle size={14} /> Cancel this booking
      </button>

      {open && (
        <CancelBookingModal
          bookingId={bookingId}
          propertyName={propertyName}
          checkIn={checkIn}
          actor="guest"
          token={token}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
