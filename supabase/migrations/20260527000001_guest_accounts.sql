-- ============================================================
-- StayNest — guest accounts
-- ============================================================
-- Lets a signed-in guest claim ownership of their bookings so they can
-- view them on /account/bookings. Anonymous bookings (user_id NULL) keep
-- working — they just don't show up in any account.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_user_id_idx
  ON public.bookings (user_id)
  WHERE user_id IS NOT NULL;

-- Replace the wide-open SELECT policy. Authenticated users only see their
-- own rows. Admin routes use the service role and bypass RLS, so the
-- agent dashboard is unaffected.
DROP POLICY IF EXISTS bookings_read_open ON public.bookings;

DROP POLICY IF EXISTS bookings_read_own ON public.bookings;
CREATE POLICY bookings_read_own ON public.bookings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Tighten insert: anyone may still create a booking, but if they pass a
-- user_id it must match their own JWT — they can't plant rows under
-- somebody else's account.
DROP POLICY IF EXISTS bookings_insert_anyone ON public.bookings;
CREATE POLICY bookings_insert_anyone ON public.bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
