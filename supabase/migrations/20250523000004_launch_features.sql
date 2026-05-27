-- ============================================================
-- StayNest — launch features
-- ============================================================
-- Adds restock notifications + recently viewed tracking.
-- Next.js route handlers use the service role for writes/reads; public users
-- do not access these tables directly.

-- Public listing/detail pages must be able to render unavailable listings so
-- visitors can request a restock/availability notification. Archived listings
-- remain hidden.
DROP VIEW IF EXISTS public.properties_public;
CREATE VIEW public.properties_public
WITH (security_invoker = true) AS
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

-- ---- Restock / availability notifications ----
CREATE TABLE IF NOT EXISTS public.restock_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  user_id     UUID,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status = ANY (ARRAY['active','notified','cancelled'])),
  notified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT restock_subscriptions_email_lower
    CHECK (email = lower(email)),
  CONSTRAINT restock_subscriptions_unique_email
    UNIQUE (property_id, email)
);

CREATE INDEX IF NOT EXISTS restock_subscriptions_property_status_idx
  ON public.restock_subscriptions (property_id, status);

ALTER TABLE public.restock_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restock_subscriptions_no_direct_access ON public.restock_subscriptions;
CREATE POLICY restock_subscriptions_no_direct_access
  ON public.restock_subscriptions
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ---- Recently viewed tracking ----
CREATE TABLE IF NOT EXISTS public.recently_viewed_properties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  guest_id    TEXT,
  user_id     UUID,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recently_viewed_identity
    CHECK (guest_id IS NOT NULL OR user_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS recently_viewed_properties_guest_unique
  ON public.recently_viewed_properties (guest_id, property_id)
  WHERE guest_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS recently_viewed_properties_user_unique
  ON public.recently_viewed_properties (user_id, property_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS recently_viewed_properties_guest_time_idx
  ON public.recently_viewed_properties (guest_id, viewed_at DESC)
  WHERE guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS recently_viewed_properties_user_time_idx
  ON public.recently_viewed_properties (user_id, viewed_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.recently_viewed_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS recently_viewed_properties_no_direct_access ON public.recently_viewed_properties;
CREATE POLICY recently_viewed_properties_no_direct_access
  ON public.recently_viewed_properties
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);
