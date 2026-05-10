-- ============================================================
-- StayNest — initial schema
-- ============================================================

-- ---- owners ----
CREATE TABLE IF NOT EXISTS public.owners (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL,
  email          TEXT,
  payout_method  TEXT CHECK (payout_method = ANY (ARRAY['M-Pesa','Bank','Cash'])),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ---- properties ----
CREATE TABLE IF NOT EXISTS public.properties (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  location           TEXT NOT NULL,
  city               TEXT NOT NULL,
  type               TEXT NOT NULL CHECK (type = ANY (ARRAY['Studio','Apartment','House','Villa','Room'])),
  listing_type       TEXT NOT NULL DEFAULT 'short_stay' CHECK (listing_type = ANY (ARRAY['short_stay','sale','lease'])),
  description        TEXT NOT NULL DEFAULT '',
  images             JSONB NOT NULL DEFAULT '[]',
  bedrooms           INTEGER NOT NULL DEFAULT 1,
  bathrooms          INTEGER NOT NULL DEFAULT 1,
  guests             INTEGER NOT NULL DEFAULT 1,
  -- short_stay pricing
  owner_base_price   INTEGER CHECK (owner_base_price >= 0),
  markup             INTEGER NOT NULL DEFAULT 0 CHECK (markup >= 0),
  -- sale pricing
  sale_price         BIGINT CHECK (sale_price >= 0),
  sale_markup        BIGINT DEFAULT 0 CHECK (sale_markup >= 0),
  -- lease pricing
  monthly_rent       BIGINT CHECK (monthly_rent >= 0),
  lease_markup       BIGINT DEFAULT 0 CHECK (lease_markup >= 0),
  lease_term_months  INTEGER,
  amenities          TEXT[] NOT NULL DEFAULT '{}',
  rules              TEXT[] NOT NULL DEFAULT '{}',
  rating             NUMERIC NOT NULL DEFAULT 0,
  reviews            INTEGER NOT NULL DEFAULT 0,
  available          BOOLEAN NOT NULL DEFAULT true,
  owner_id           UUID NOT NULL REFERENCES public.owners (id) ON DELETE RESTRICT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- ---- bookings ----
CREATE TABLE IF NOT EXISTS public.bookings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id               UUID NOT NULL REFERENCES public.properties (id) ON DELETE RESTRICT,
  guest_name                TEXT NOT NULL,
  guest_email               TEXT NOT NULL,
  guest_phone               TEXT NOT NULL,
  check_in                  DATE NOT NULL,
  check_out                 DATE NOT NULL,
  guests                    INTEGER NOT NULL DEFAULT 1,
  nights                    INTEGER NOT NULL CHECK (nights >= 1),
  price_per_night           INTEGER NOT NULL,
  subtotal                  INTEGER NOT NULL,
  service_fee               INTEGER NOT NULL DEFAULT 0,
  total                     INTEGER NOT NULL,
  owner_payout              INTEGER NOT NULL,
  agent_profit              INTEGER NOT NULL,
  status                    TEXT NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','confirmed','cancelled','completed'])),
  payment_status            TEXT NOT NULL DEFAULT 'unpaid',
  mpesa_checkout_request_id TEXT,
  mpesa_receipt_number      TEXT,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- ---- inquiries ----
CREATE TABLE IF NOT EXISTS public.inquiries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      UUID NOT NULL REFERENCES public.properties (id) ON DELETE RESTRICT,
  kind             TEXT NOT NULL CHECK (kind = ANY (ARRAY['viewing','offer','lease_application'])),
  guest_name       TEXT NOT NULL,
  guest_email      TEXT NOT NULL,
  guest_phone      TEXT NOT NULL,
  preferred_date   DATE,
  offer_amount     BIGINT,
  move_in_date     DATE,
  lease_term_months INTEGER,
  message          TEXT,
  status           TEXT NOT NULL DEFAULT 'new' CHECK (status = ANY (ARRAY['new','contacted','closed'])),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ---- reviews ----
CREATE TABLE IF NOT EXISTS public.reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties (id) ON DELETE CASCADE,
  booking_id  UUID UNIQUE REFERENCES public.bookings (id) ON DELETE SET NULL,
  guest_name  TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_property_id_idx ON public.reviews (property_id);

-- ---- trigger: keep properties.rating + properties.reviews in sync ----
CREATE OR REPLACE FUNCTION public.update_property_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE properties
  SET
    rating  = ROUND((SELECT AVG(rating)::numeric FROM reviews WHERE property_id = NEW.property_id), 1),
    reviews = (SELECT COUNT(*) FROM reviews WHERE property_id = NEW.property_id)
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_property_rating ON public.reviews;
CREATE TRIGGER trg_update_property_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_property_rating();
