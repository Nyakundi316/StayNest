-- ============================================================
-- StayNest — storage bucket for property images
-- ============================================================
-- The admin "Add property" form uploads images via /api/upload, which
-- writes to this bucket. Without it, image upload fails on a fresh deploy.

-- ---- Bucket ----
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---- Policies on storage.objects ----
-- Public read so <img src> works for everyone.
DROP POLICY IF EXISTS property_images_public_read ON storage.objects;
CREATE POLICY property_images_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'property-images');

-- Upload allowed into this bucket. The /api/upload route is admin-gated at the
-- application layer (requireAdmin), so this stays scoped to the bucket only.
DROP POLICY IF EXISTS property_images_upload ON storage.objects;
CREATE POLICY property_images_upload ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'property-images');
