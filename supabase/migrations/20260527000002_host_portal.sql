-- ============================================================
-- StayNest — host portal
-- ============================================================
-- Links property owners to Supabase auth users and tightens RLS so a host
-- can only read their own data. Admin/API routes use the service role and
-- bypass RLS, so the agent dashboard is unaffected.

ALTER TABLE public.owners
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS owners_user_id_unique
  ON public.owners (user_id)
  WHERE user_id IS NOT NULL;

-- ---- owners: replace open read with own-row read ----
DROP POLICY IF EXISTS owners_read_open ON public.owners;
DROP POLICY IF EXISTS owners_read_own ON public.owners;
CREATE POLICY owners_read_own ON public.owners
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ---- properties: split the wide-open read into two narrower ones ----
-- 1) Anonymous visitors browse via the security_invoker public view, which
--    needs the caller to pass RLS on the underlying table. Limit them to
--    non-archived rows; the view itself masks owner_id and economics.
-- 2) An authenticated host sees only their own properties (including
--    archived ones, since hosts care about their full history).
DROP POLICY IF EXISTS properties_public_read ON public.properties;
DROP POLICY IF EXISTS properties_read_active ON public.properties;
DROP POLICY IF EXISTS properties_read_own_host ON public.properties;

CREATE POLICY properties_read_active ON public.properties
  FOR SELECT TO anon, authenticated
  USING (archived = false);

CREATE POLICY properties_read_own_host ON public.properties
  FOR SELECT TO authenticated
  USING (
    owner_id IN (
      SELECT id FROM public.owners WHERE user_id = auth.uid()
    )
  );

-- ---- bookings: add a host-side SELECT in addition to bookings_read_own ----
-- Postgres OR-combines policies, so a row visible to either the guest who
-- booked it or the host who owns the property will be returned.
DROP POLICY IF EXISTS bookings_read_host ON public.bookings;
CREATE POLICY bookings_read_host ON public.bookings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.owners o ON o.id = p.owner_id
      WHERE p.id = bookings.property_id
        AND o.user_id = auth.uid()
    )
  );
