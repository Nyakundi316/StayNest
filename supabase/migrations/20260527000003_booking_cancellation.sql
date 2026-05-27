-- ============================================================
-- StayNest — booking cancellation audit
-- ============================================================
-- Adds the columns that the new cancel endpoint writes when a guest or
-- host cancels their own booking. Status still moves to 'cancelled'; these
-- columns just preserve who and why so admin/host can reason about late
-- cancellations or refund eligibility.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT
    CHECK (cancelled_by IS NULL OR cancelled_by IN ('guest', 'host', 'admin'));
