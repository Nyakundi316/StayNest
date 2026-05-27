-- ============================================================
-- StayNest — Supabase advisor hygiene
-- ============================================================
-- Two no-op-from-the-app-perspective fixes flagged by the database
-- linter. The API routes use the service role and bypass RLS, so app
-- behaviour is unchanged.

-- 1) inquiries: written exclusively via /api/inquiry/create (service role).
--    No anon policy is needed; RLS stays on so direct anon access fails
--    closed. The linter reports a benign "RLS enabled, no policy" INFO,
--    which is the correct state for a service-role-only table.
DROP POLICY IF EXISTS inquiries_insert_anyone ON public.inquiries;
DROP POLICY IF EXISTS inquiries_read_open ON public.inquiries;

-- 2) update_property_rating ran with a mutable search_path — a function-
--    hijack risk if a privileged caller has a user-controlled search_path.
--    Qualify the table references AND pin the search_path explicitly.
CREATE OR REPLACE FUNCTION public.update_property_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.properties
  SET
    rating  = ROUND(
      (SELECT AVG(rating)::numeric FROM public.reviews WHERE property_id = NEW.property_id),
      1
    ),
    reviews = (SELECT COUNT(*) FROM public.reviews WHERE property_id = NEW.property_id)
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$function$;
