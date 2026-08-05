-- ============================================================
-- StayNest — close the raw properties economics leak
-- ============================================================
-- The host_portal migration (20260527000002) re-opened anon/authenticated
-- SELECT on the *raw* public.properties table via `properties_read_active`,
-- so that the security_invoker `properties_public` view could resolve for
-- anonymous visitors.
--
-- Side effect: anyone holding the public anon key could query
-- `public.properties` directly and read owner_base_price, markup, sale_markup,
-- lease_markup and owner_id — the exact second-party-agent economics the model
-- is supposed to hide. The masking view doesn't help if the raw table is
-- readable beside it.
--
-- Fix: make `properties_public` a SECURITY DEFINER view (runs with the view
-- owner's privileges) so it no longer depends on an anon RLS policy on the
-- underlying table, then remove the raw anon/authenticated read policy. The
-- browser only ever reads the view (src/lib/data.ts), and the admin/host
-- dashboards read through service-role API routes, so no app path needs raw
-- anon access.
--
-- Tradeoff: Supabase's database linter flags SECURITY DEFINER views
-- (`security_definer_view`). That is expected and acceptable here — this is a
-- read-only, column-masking projection with a fixed `WHERE archived = false`
-- and no RLS-bypassing writes. Closing a live margin/owner-identity leak
-- outweighs a linter note about a deliberately curated public view.

-- 1. Recreate the public-safe view WITHOUT security_invoker. A plain view runs
--    with its owner's privileges, so anon can read it without any direct RLS
--    grant on public.properties. Columns still collapse base price + markup and
--    null out owner_id, so economics never leave the database.
DROP VIEW IF EXISTS public.properties_public;
CREATE VIEW public.properties_public
WITH (security_barrier = true) AS
SELECT
  id, name, location, city, type, listing_type, description, images,
  bedrooms, bathrooms, guests, amenities, rules, rating, reviews,
  available, created_at, lease_term_months,
  (COALESCE(owner_base_price, 0) + COALESCE(markup, 0))       AS owner_base_price,
  0                                                           AS markup,
  (COALESCE(sale_price, 0)       + COALESCE(sale_markup, 0))  AS sale_price,
  0                                                           AS sale_markup,
  (COALESCE(monthly_rent, 0)     + COALESCE(lease_markup, 0)) AS monthly_rent,
  0                                                           AS lease_markup,
  NULL::uuid                                                  AS owner_id
FROM public.properties
WHERE archived = false;

GRANT SELECT ON public.properties_public TO anon, authenticated;

-- 2. Remove the leaky raw-table read policy. After this, anon/authenticated
--    cannot SELECT from public.properties at all — only through the masking
--    view above.
DROP POLICY IF EXISTS properties_read_active ON public.properties;

-- `properties_read_own_host` is intentionally kept: an authenticated host may
-- still read their OWN raw property rows (their own economics, which is
-- legitimate). The public view no longer relies on any properties RLS policy.

-- 3. Drop the unused anon/authenticated INSERT policy on bookings. Every
--    booking is created through /api/booking/create, which uses the service
--    role and bypasses RLS (SUPABASE_SERVICE_ROLE_KEY is configured). No
--    browser code inserts bookings with the anon key, so this policy only
--    widened attack surface: with just the public anon key, anyone could plant
--    arbitrary booking rows — bogus totals/profit, or rows that block real
--    date ranges via the no-overlap constraint — bypassing the API's price,
--    capacity, overlap and rate-limit checks. Reads stay scoped by
--    bookings_read_own / bookings_read_host.
DROP POLICY IF EXISTS bookings_insert_anyone ON public.bookings;
