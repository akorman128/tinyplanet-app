-- Ensure the avatars storage bucket is PUBLIC.
--
-- 20260318000002_create_avatars_bucket.sql created the bucket with
-- `INSERT ... ON CONFLICT (id) DO NOTHING`. On any environment where an
-- `avatars` bucket already existed (e.g. created via the dashboard as a private
-- bucket), that ON CONFLICT clause silently skipped the row and never set
-- `public = true`. The result: the file uploads fine (authenticated INSERT
-- policy), but the public object URL returned by getPublicUrl() responds with
-- 404 "Bucket not found", so avatars never render in the app.
--
-- Force the bucket public idempotently (creates it if missing, flips it public
-- if it already exists).
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;
