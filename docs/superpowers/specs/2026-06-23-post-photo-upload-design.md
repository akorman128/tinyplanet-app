# Post photo upload with on-device metadata stripping

**Date:** 2026-06-23
**Status:** Approved design — implemented
**Branch:** feat/post-photo-upload

> **Revision (2026-06-23):** The originally-approved design enforced metadata
> stripping **server-side** (private staging bucket → `strip-image-metadata` edge
> function → public bucket). That layer was removed during review as overbuilt.
> `expo-image-manipulator` already re-encodes every photo to a fresh JPEG
> on-device, which drops all EXIF/GPS/IPTC/XMP *before any byte leaves the phone*.
> The server enforcement only changed behavior for a client that deliberately
> bypasses the app to upload its own un-stripped original to a public bucket —
> i.e. a user leaking their *own* location to their *own* audience, which they can
> do countless other ways. The existing `useUploadAvatar` flow (direct upload to a
> public bucket, client-side strip, no server step) already set the accepted bar;
> this feature now matches it. See "Why on-device is sufficient".

## Goal

Let users attach photos from their phone's library when creating a post, with all
metadata (EXIF/GPS/IPTC/XMP) removed from every published image, for privacy.

## Scope (v1)

- Up to **4 photos** per post, from the **photo library** (no camera).
- Photos attach during **post creation** only (edit-post unchanged).
- Metadata stripping happens **on-device** (re-encode), same as avatars.
- Photos render in the feed/post.

### Explicitly out of scope for v1

Camera capture · editing a post's photos · videos / Live Photos / GIF motion ·
alt-text · reordering · more than 4 photos · fullscreen photo viewer ·
content moderation · signed-URL (visibility-gated) access · scheduled
orphan-sweep job · server-enforced stripping.

## Key decisions

1. **Strip strategy: on-device re-encode.** `expo-image-manipulator` decodes to
   pixels and re-encodes JPEG, producing output built solely from pixel data — so
   EXIF/GPS/IPTC/XMP is dropped. Same mechanism the avatar flow relies on. No
   server round-trip.
2. **Storage: single public bucket** (`post-media`), unguessable path per object,
   same model as avatars. Accepts that a leaked URL exposes the image regardless
   of post visibility. Private + signed URLs is a noted follow-up.
3. **Publish on submit, not on pick** — images enter storage only when the user
   actually posts, minimizing orphaned objects.

## Architecture & data flow

```
Composer (create-post)
  pick library photos (≤4)
    └─ expo-image-manipulator: auto-orient + resize(maxW≈1600) + re-encode JPEG(q≈0.8)
         → upright, metadata-free JPEG  (shown as local preview immediately)

On SUBMIT (publishAll), per photo in parallel:
  1. readImageAsArrayBuffer(localUri, ≤8 MiB)
  2. upload bytes → post-media/{uid}/{ts}-{rand}.jpg     [PUBLIC bucket]
  3. getPublicUrl → clean public URL
  (if any photo fails, best-effort delete the ones that already uploaded)

  create post: insert posts.media_urls = [url, …]   (existing insert path, unchanged)
  on insert failure → best-effort delete the just-uploaded objects

Feed: PostCard → PostMediaGallery renders media_urls via expo-image
```

### Why on-device is sufficient

`manipulateAsync` re-encodes from decoded pixels, so the uploaded JPEG carries no
metadata in the normal app flow — GPS never leaves the phone. The only residual
gap is a user who hand-crafts an upload to their own `{uid}/` folder bypassing the
app; that user can only expose their *own* image to their *own* audience, a
non-threat with infinitely many easier paths. Matching the avatar bar keeps the
feature simple without weakening the real privacy outcome.

## Components

### 1. Storage bucket + RLS — new migration

`supabase/migrations/<ts>_create_post_media_buckets.sql`

- **`post-media`** — `public = true`, size limit ~8 MiB, `allowed_mime_types =
  {image/jpeg}` (defense-in-depth).
  - `INSERT` policy: authenticated, `(storage.foldername(name))[1] = auth.uid()::text`
    (a user may write only their own folder).
  - Public read `SELECT` policy (consistent with avatars).
  - Owner `DELETE` policy (cleanup on post delete / failed create).
- `posts.media_urls` capped at 4 via `CHECK … NOT VALID` (defense in depth;
  `NOT VALID` so it can't abort on pre-existing rows).

### 2. Client hook `useUploadPostImages`

`hooks/useUploadPostImages.ts` — mirrors `useUploadAvatar`.

- `pick()`: `ImagePicker.launchImageLibraryAsync({ mediaTypes: images, allowsMultipleSelection: true, selectionLimit: remaining })`, then per asset
  `ImageManipulator.manipulateAsync(uri, resize≤1600, { compress: 0.8, format: JPEG })`
  → metadata-free local `uri` (immediate preview).
- `publishAll()`: per photo, `readImageAsArrayBuffer` (≤8 MiB) → upload to
  `post-media/{uid}/{ts}-{rand}.jpg` → `getPublicUrl`. Parallel via
  `Promise.allSettled`; on any rejection, best-effort removes the photos that
  already uploaded so a partial failure can't strand orphans.

Orientation note: `expo-image-manipulator` bakes EXIF orientation into the pixels
(confirmed by the existing avatar flow rendering upright), so there is no
orientation tag to honor downstream.

### 3. Composer UI — `PostForm.tsx` / `create-post.tsx`

- "Add photo" button (create path only — gated behind a prop so edit-post is
  unchanged) → library picker.
- Horizontal thumbnail row, local manipulated `uri` preview, per-item remove (×);
  add/remove disabled while publishing.
- On submit: `useUploadPostImages.publishAll()`, then
  `createPost.mutateAsync({ …, media_urls })`.

### 4. Display — `PostCard` + new `PostMediaGallery`

`components/PostMediaGallery.tsx`, rendered by `PostCard` when `media_urls`
non-empty. `expo-image`, `contentFit: cover`: 1 = full-width rounded; 2 = side by
side; 3–4 = simple grid. (PostCard renders nothing for media today; additive.)

### 5. Lifecycle / cleanup

- **On post delete:** the delete mutation best-effort removes the post's
  `post-media` objects (`postMediaPathsFromUrls`). Prevents permanent orphans.
- **On create failure after upload:** best-effort delete the just-uploaded objects.
- **On partial upload failure:** `publishAll` removes the already-uploaded photos.
- A TTL sweep for the rare residual failure tail is a noted follow-up.

## Edge cases & handling

- **EXIF orientation** → baked into pixels by the client manipulate step (else
  portrait photos render sideways). Verified behavior against the avatar flow.
- **HEIC (iOS)** → converted to JPEG on-device by the manipulate step.
- **PNG transparency** → flattened on white when re-encoding to JPEG.
- **Display-P3 / ICC** → output sRGB (minor color shift, acceptable for social).
- **`media_urls` length** → client caps at 4; DB `CHECK … <= 4` for defense in
  depth.

## Testing

- **Storage policy tests** (`__tests__/rpc` harness):
  - authenticated client **can** upload to `post-media/{own uid}/…`,
  - **cannot** upload under another uid's prefix,
  - owner-delete asserted in prod (skipped locally — storage-api v1.29
    `allow_delete_query` bug blocks all API deletes on the local stack).
- **`postMediaPathsFromUrls`** unit test (path extraction for cleanup).
- **Post creation** with populated `media_urls` inserts and the feed RPC returns
  the URLs.

## Files

**New**
- `supabase/migrations/<ts>_create_post_media_buckets.sql`
- `hooks/useUploadPostImages.ts`
- `components/PostMediaGallery.tsx`
- `utils/postMedia.ts` (`postMediaPathsFromUrls`)
- `utils/imageBytes.ts` (`readImageAsArrayBuffer`, shared with the avatar flow)

**Modified**
- `components/PostForm.tsx` / `app/(protected)/create-post.tsx` (photo UI, gated to create)
- `design-system/PostCard.tsx` (render gallery)
- post delete mutation in `hooks/usePosts.ts` (media cleanup)

**Unchanged (already ready)**
- `posts.media_urls text[]`, `CreatePostInput.media_urls`, the post insert path.
