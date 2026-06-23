-- Public bucket for post photos. Clients upload directly under their own {uid}/
-- prefix; expo-image-manipulator re-encodes each photo to a fresh JPEG on-device,
-- which drops all EXIF/GPS/IPTC/XMP before upload (same approach as avatars).
-- allowed_mime_types is defense-in-depth (the declared content-type is
-- client-controlled, but it blocks the obvious non-image upload).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-media', 'post-media', true, 8388608, ARRAY['image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- A user may upload only under their own {uid}/ prefix.
CREATE POLICY "Users upload post media to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for delivered post media.
CREATE POLICY "Public read access for post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Owner may delete their own objects (cleanup on post delete / failed create).
CREATE POLICY "Users delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Defense in depth: cap media_urls at 4 at the database boundary. NOT VALID so
-- the migration can't abort on any pre-existing row; it still enforces on every
-- insert/update going forward.
ALTER TABLE public.posts
  ADD CONSTRAINT posts_media_urls_max_four
  CHECK (coalesce(array_length(media_urls, 1), 0) <= 4) NOT VALID;
