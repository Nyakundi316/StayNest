-- ============================================================
-- StayNest — Row Level Security policies
-- ============================================================

-- ---- owners (read-only for public) ----
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owners_read_open ON public.owners;
CREATE POLICY owners_read_open ON public.owners
  FOR SELECT TO anon, authenticated USING (true);

-- ---- properties (read-only for public) ----
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS properties_public_read ON public.properties;
CREATE POLICY properties_public_read ON public.properties
  FOR SELECT TO anon, authenticated USING (true);

-- ---- bookings (anyone can insert; open read for admin dashboard) ----
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_insert_anyone ON public.bookings;
CREATE POLICY bookings_insert_anyone ON public.bookings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS bookings_read_open ON public.bookings;
CREATE POLICY bookings_read_open ON public.bookings
  FOR SELECT TO anon, authenticated USING (true);

-- ---- inquiries (anyone can insert; open read for admin dashboard) ----
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inquiries_insert_anyone ON public.inquiries;
CREATE POLICY inquiries_insert_anyone ON public.inquiries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS inquiries_read_open ON public.inquiries;
CREATE POLICY inquiries_read_open ON public.inquiries
  FOR SELECT TO anon, authenticated USING (true);

-- ---- reviews (public read + insert; no public update/delete) ----
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reviews_read_open ON public.reviews;
CREATE POLICY reviews_read_open ON public.reviews
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS reviews_insert_anyone ON public.reviews;
CREATE POLICY reviews_insert_anyone ON public.reviews
  FOR INSERT TO anon, authenticated WITH CHECK (true);
