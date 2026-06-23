# Post photo upload with server-enforced metadata stripping

**Date:** 2026-06-23
**Status:** Approved design — ready for implementation plan
**Branch:** design-system-hardening (feature work)

## Goal

Let users attach photos from their phone's library when creating a post, and
**guarantee all metadata (EXIF/GPS/IPTC/XMP) is removed** from every published
image, for privacy/security.

## Scope (v1)

- Up to **4 photos** per post, from the **photo library** (no camera).
- Photos attach during **post creation** only (edit-post unchanged).
- Metadata stripping is **enforced server-side**, additionally stripped
  on-device for privacy.
- Photos render in the feed/post.

### Explicitly out of scope for v1

Camera capture · editing a post's photos · videos / Live Photos / GIF motion ·
alt-text · reordering · more than 4 photos · fullscreen photo viewer ·
content moderation · signed-URL (visibility-gated) access · scheduled
orphan-sweep job.

## Key decisions (made during brainstorming)

1. **Strip strategy: hybrid** — client normalizes+strips on-device, edge
   function re-strips and is the *sole* publisher. The server step is the
   enforcement; the client step is a privacy bonus (GPS never leaves the phone
   in the normal path) that also makes the server's job trivial (it always
   receives JPEG).
2. **Storage: public bucket** for v1 (unguessable UUID paths, same model as
   avatars). Accepts that a leaked URL exposes the image regardless of post
   visibility. Private + signed URLs is a noted follow-up.
3. **Publish on submit, not on pick** — images enter storage only when the user
   actually posts, minimizing orphaned objects.

## Architecture & data flow

```
Composer (create-post)
  pick library photos (≤4)
    └─ expo-image-manipulator: auto-orient + resize(maxW≈1600) + re-encode JPEG(q≈0.7)
         → upright, metadata-free JPEG  (shown as local preview immediately)

On SUBMIT, per photo (in parallel):
  1. fetch(manipulatedUri).arrayBuffer()
  2. upload bytes → post-media-staging/{uid}/{uuid}.jpg     [PRIVATE bucket]
  3. invoke edge fn `strip-image-metadata` { stagingPath }
         ├─ assert stagingPath starts with caller's {uid}/
         ├─ service-role download from staging
         ├─ guard: max bytes + max megapixels (decompression-bomb)
         ├─ imagescript: decode → re-encode JPEG   (drops ALL metadata; validates it's a real image)
         ├─ service-role upload → post-media/{uid}/{uuid}.jpg   [PUBLIC bucket, no client write]
         ├─ delete staging original
         └─ return { url }
  4. collect clean public URLs

  create post: insert posts.media_urls = [url, …]   (existing insert path, unchanged)
  on insert failure → best-effort delete the just-published objects

Feed: PostCard → PostMediaGallery renders media_urls via expo-image
```

### Why this is secure

`post-media` has **no client write policy** — only the edge function
(service role) can publish. A tampered client can at most drop a file into the
*private* staging bucket, which is never served. Every byte the public sees came
out of the server's re-encoder, so it is metadata-free regardless of client
behavior.

## Components

### 1. Storage buckets + RLS — new migration

`supabase/migrations/<ts>_create_post_media_buckets.sql`

- **`post-media-staging`** — `public = false`, per-bucket size limit ~8 MiB.
  - `INSERT` policy: authenticated, `(storage.foldername(name))[1] = auth.uid()::text`.
  - No client read/delete needed (edge fn uses service role, bypasses RLS).
- **`post-media`** — `public = true` (public read).
  - **No INSERT/UPDATE/DELETE policy for any client role.** (Service role
    bypasses RLS → only the edge fn writes.) This is the whole guarantee.
  - Public read SELECT policy for consistency with the avatars bucket.

### 2. Edge function `strip-image-metadata`

`supabase/functions/strip-image-metadata/index.ts`, registered in
`supabase/config.toml`. JWT-authed (default). Input `{ stagingPath: string }`,
returns `{ url: string }`.

- Derive `userId` from JWT; reject unless `stagingPath` starts with `${userId}/`.
- Service-role client downloads the staging object.
- **Guards:** reject if bytes > MAX_BYTES (~8 MB); parse JPEG SOF dimensions and
  reject if `width*height` > MAX_PIXELS (~50 MP) **before** full decode.
- `imagescript`: `Image.decode(bytes)` → `encodeJPEG(quality)`. Re-encoding from
  decoded pixels produces a clean JPEG with no EXIF/GPS/IPTC/XMP. A buffer that
  fails to decode is rejected (sanitization side-effect).
- Upload result to `post-media/{userId}/{uuid}.jpg` (service role,
  `contentType: image/jpeg`, long `cacheControl`).
- Delete the staging original. Return the public URL.

`imagescript` chosen over ImageMagick-WASM: input is always JPEG (client already
normalized), so we don't need HEIC decoding or an 8 MB WASM bundle with a fragile
delegate. Lighter, faster cold start.

### 3. Client hook `useUploadPostImages`

`hooks/useUploadPostImages.ts` — mirrors `useUploadAvatar`.

- `pick()`: `ImagePicker.launchImageLibraryAsync({ mediaTypes: images, allowsMultipleSelection: true, selectionLimit: 4 })`.
- Per asset, on submit: `ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1600 } }], { compress: 0.7, format: JPEG })` → `fetch().arrayBuffer()` → upload to staging → `supabase.functions.invoke('strip-image-metadata', { body: { stagingPath } })` → collect `url`.
- Client-side size guard on the manipulated bytes. Per-photo error surfaces a
  retry; parallelized across the ≤4 photos.

Orientation note: `expo-image-manipulator` bakes EXIF orientation into the pixels
(confirmed by the existing avatar flow rendering upright), so the server receives
upright JPEG with no orientation tag to honor.

### 4. Composer UI — `PostForm.tsx` / `create-post.tsx`

- "Add photo" button (create path only — gate behind a prop so edit-post is
  unchanged) → library picker.
- Horizontal thumbnail row, local manipulated `uri` preview, per-item remove (×).
- On submit: run `useUploadPostImages`, then `createPost.mutateAsync({ …, media_urls })`.

### 5. Display — `PostCard` + new `PostMediaGallery`

`components/PostMediaGallery.tsx`, rendered by `PostCard` when `media_urls`
non-empty. `expo-image`, `contentFit: cover`: 1 = full-width rounded; 2 = side by
side; 3–4 = simple grid. (PostCard renders nothing for media today; additive.)

### 6. Lifecycle / cleanup

- **On post delete:** the delete mutation best-effort removes the post's
  `post-media` objects (parse storage path from each `media_url`). Prevents
  permanent orphans. (DB-trigger-based cleanup noted as a more robust follow-up.)
- **On create failure after publish:** best-effort delete the just-published
  objects.
- Staging originals are always deleted by the edge fn on success; a TTL sweep of
  both buckets is a noted follow-up for the failure tail.

## Edge cases & handling

- **EXIF orientation** → baked into pixels by the client manipulate step (else
  portrait photos render sideways). Verified behavior against the avatar flow.
- **HEIC (iOS)** → converted to JPEG on-device by the manipulate step; the server
  never sees HEIC.
- **Decompression bomb** → edge-fn byte + megapixel guards before decode.
- **PNG transparency** → flattened on white when re-encoding to JPEG.
- **Display-P3 / ICC** → output sRGB (minor color shift, acceptable for social).
- **Non-image / corrupt bytes** → fail to decode → edge fn rejects.
- **`media_urls` length** → client caps at 4; optional DB
  `CHECK (coalesce(array_length(media_urls,1),0) <= 4)` for defense in depth.

## Testing

- **Storage policy tests** (existing `__tests__/rpc` harness style):
  - authenticated client **can** upload to `post-media-staging/{own uid}/…`,
  - **cannot** upload under another uid's prefix,
  - **cannot** upload to `post-media` (any path).
- **Edge-fn integration test** (`supabase functions serve` in harness): upload a
  JPEG carrying known EXIF + GPS to staging, invoke the function, download the
  result, assert the `Exif\0\0` APP1 marker and GPS IFD are absent and the image
  still decodes.
- **Post creation** with populated `media_urls` inserts and the feed RPC returns
  the URLs.

## Files

**New**
- `supabase/migrations/<ts>_create_post_media_buckets.sql`
- `supabase/functions/strip-image-metadata/index.ts`
- `hooks/useUploadPostImages.ts`
- `components/PostMediaGallery.tsx`

**Modified**
- `supabase/config.toml` (register edge function)
- `components/PostForm.tsx` / `app/(protected)/create-post.tsx` (photo UI, gated to create)
- `components/PostCard.tsx` (render gallery)
- post delete mutation in `hooks/usePosts.ts` (media cleanup)

**Unchanged (already ready)**
- `posts.media_urls text[]`, `CreatePostInput.media_urls`, the post insert path.
