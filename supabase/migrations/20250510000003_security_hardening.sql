-- ============================================================
-- StayNest — security hardening + production features
-- ============================================================
-- Run after 0001_initial_schema and 0002_rls_policies.
-- Locks down raw tables, exposes a public-safe properties view,
-- adds soft-delete + unguessable review tokens + overlap guard.

-- ---- 1. Soft-delete flags (archive instead of hard delete) ----
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.owners     ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

-- ---- 2. Unguessable review token ----
-- Review links use this token instead of the raw booking UUID so guests
-- can't enumerate other bookings.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS review_token UUID NOT NULL DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS bookings_review_token_idx ON public.bookings (review_token);

-- ---- 3. Public-safe properties view ----
-- Clients only ever see the final combined price. Owner base price, markup,
-- payout economics and owner_id never leave the database.
--
-- The prototype already has a properties_public view with a different column
-- shape (`client_price`). Drop it first because CREATE OR REPLACE VIEW cannot
-- rename/drop existing view columns.
DROP VIEW IF EXISTS public.properties_public;
-- security_invoker = true so the view runs with the caller's privileges and
-- still respects RLS (avoids the SECURITY DEFINER advisor error).
CREATE VIEW public.properties_public
WITH (security_invoker = true) AS
SELECT
  id, name, location, city, type, listing_type, description, images,
  bedrooms, bathrooms, guests, amenities, rules, rating, reviews,
  available, created_at, lease_term_months,
  -- Collapsed client price exposed in the SAME column names the app mapper
  -- already reads, with the markup component zeroed out.
  (COALESCE(owner_base_price, 0) + COALESCE(markup, 0))      AS owner_base_price,
  0                                                          AS markup,
  (COALESCE(sale_price, 0)       + COALESCE(sale_markup, 0))  AS sale_price,
  0                                                          AS sale_markup,
  (COALESCE(monthly_rent, 0)     + COALESCE(lease_markup, 0)) AS monthly_rent,
  0                                                          AS lease_markup,
  NULL::uuid                                                 AS owner_id
FROM public.properties
WHERE available = true AND archived = false;

GRANT SELECT ON public.properties_public TO anon, authenticated;

-- ---- 4. Lock down raw tables ----
-- Server API routes use the service-role key and bypass RLS. The browser
-- (anon/authenticated) loses all direct access to sensitive tables.

-- properties: no raw public read — use properties_public instead
DROP POLICY IF EXISTS properties_public_read ON public.properties;

-- owners: never publicly readable (payout info)
DROP POLICY IF EXISTS owners_read_open ON public.owners;

-- bookings: created + read only via service-role API routes
DROP POLICY IF EXISTS bookings_insert_anyone ON public.bookings;
DROP POLICY IF EXISTS bookings_read_open    ON public.bookings;

-- inquiries: created + read only via service-role API routes
DROP POLICY IF EXISTS inquiries_insert_anyone ON public.inquiries;
DROP POLICY IF EXISTS inquiries_read_open     ON public.inquiries;

-- reviews: public may READ (shown on listing pages); writes go through the
-- token-protected API (service role), so remove the open insert policy.
DROP POLICY IF EXISTS reviews_insert_anyone ON public.reviews;
-- reviews_read_open is intentionally kept.

-- ---- 5. Prevent double bookings at the DB level ----
-- Defense in depth alongside the server-side overlap check. Wrapped so the
-- migration still applies if legacy overlapping rows exist.
CREATE EXTENSION IF NOT EXISTS btree_gist;
DO $$
BEGIN
  ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_no_overlap
    EXCLUDE USING gist (
      property_id WITH =,
      daterange(check_in, check_out, '[)') WITH &&
    ) WHERE (status <> 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN
    RAISE WARNING 'bookings_no_overlap not added (existing overlaps?): %', SQLERRM;
END $$;
