# Post Photo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users attach up to 4 photos from their phone's library when creating a post, with all image metadata (EXIF/GPS/IPTC/XMP) guaranteed-stripped server-side before the photo is ever public.

**Architecture:** Hybrid strip. The client re-encodes each pick to an upright JPEG (strips on-device, normalizes HEIC→JPEG) and, on submit, uploads the bytes to a **private** `post-media-staging` bucket, then calls an edge function `strip-image-metadata`. The edge function (the *only* writer to the **public** `post-media` bucket) re-decodes/re-encodes the pixels — dropping all metadata — publishes the clean JPEG, deletes the staging original, and returns the public URL. The returned URLs go into the existing `posts.media_urls text[]` column via the existing insert path.

**Tech Stack:** React Native / Expo (`expo-image-picker`, `expo-image-manipulator`, `expo-image`), Supabase (Postgres + Storage + Deno edge functions, `imagescript` for decode/encode), Vitest for tests.

## Global Constraints

- **Photo source:** photo library only (no camera). `allowsMultipleSelection: true`, `selectionLimit: 4`.
- **Max photos per post:** 4 (client-enforced; DB CHECK as defense-in-depth).
- **Buckets:** `post-media-staging` = `public=false`, 8 MiB limit; `post-media` = `public=true`. `post-media` has **no client INSERT/UPDATE policy** (only service role writes) and an **owner-scoped DELETE policy** (`(storage.foldername(name))[1] = auth.uid()::text`).
- **Object paths:** `{auth.uid}/{unique}.jpg` in both buckets.
- **Edge function output:** always JPEG, metadata-free, `contentType: "image/jpeg"`.
- **Edge function guards:** reject input > 10 MB; reject parsed JPEG pixel count > 50,000,000.
- **Auth in edge function:** parse `Authorization: Bearer <jwt>`, `auth.getUser(token)`, reject unless `stagingPath` starts with `${user.id}/` (mirror `supabase/functions/resolve-list-places/index.ts`).
- **Tests** live in `__tests__/`, run with `vitest`. RPC/storage/function tests require the local Supabase stack running (`supabase start`) with migrations applied (`supabase db reset`).
- **Style:** no comments unless necessary; follow existing patterns in the listed files.

---

### Task 1: Storage buckets, policies & posts constraint (migration)

Creates the two buckets, the policies that make the security guarantee real, and a defense-in-depth CHECK on `media_urls`. Verified by storage-policy tests proving a client can write staging under its own prefix but cannot write `post-media` at all.

**Files:**
- Create: `supabase/migrations/20260623000001_create_post_media_buckets.sql`
- Test: `__tests__/rpc/post-media-policies.test.ts`

**Interfaces:**
- Produces: buckets `post-media-staging` (private) and `post-media` (public). Client INSERT allowed only on `post-media-staging/{auth.uid}/…`. Client DELETE allowed only on `post-media/{auth.uid}/…`. No client INSERT/UPDATE on `post-media`. Public read on `post-media`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/rpc/post-media-policies.test.ts`:

```ts
import { authedClientFor } from "../utils/auth-helpers";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, cleanupTestData, TestUser } from "../utils/seed";

const tinyJpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe("post-media storage policies", () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser({ full_name: "Media Alice" });
    userB = await createTestUser({ full_name: "Media Bob" });
  });

  afterAll(async () => {
    await adminClient.storage
      .from("post-media-staging")
      .remove([`${userA.id}/a.jpg`]);
    await adminClient.storage.from("post-media").remove([`${userA.id}/a.jpg`]);
    await cleanupTestData([userA.id, userB.id]);
  });

  it("lets a user upload to staging under their own prefix", async () => {
    const client = await authedClientFor(userA.email);
    const { error } = await client.storage
      .from("post-media-staging")
      .upload(`${userA.id}/a.jpg`, tinyJpeg(), {
        contentType: "image/jpeg",
        upsert: true,
      });
    expect(error).toBeNull();
  });

  it("blocks uploading to staging under another user's prefix", async () => {
    const client = await authedClientFor(userA.email);
    const { error } = await client.storage
      .from("post-media-staging")
      .upload(`${userB.id}/a.jpg`, tinyJpeg(), { contentType: "image/jpeg" });
    expect(error).not.toBeNull();
  });

  it("blocks clients from writing to the public post-media bucket", async () => {
    const client = await authedClientFor(userA.email);
    const { error } = await client.storage
      .from("post-media")
      .upload(`${userA.id}/a.jpg`, tinyJpeg(), { contentType: "image/jpeg" });
    expect(error).not.toBeNull();
  });

  it("lets a user delete their own object in post-media", async () => {
    await adminClient.storage
      .from("post-media")
      .upload(`${userA.id}/a.jpg`, tinyJpeg(), {
        contentType: "image/jpeg",
        upsert: true,
      });
    const client = await authedClientFor(userA.email);
    const { error } = await client.storage
      .from("post-media")
      .remove([`${userA.id}/a.jpg`]);
    expect(error).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run __tests__/rpc/post-media-policies.test.ts`
Expected: FAIL — buckets don't exist yet (`Bucket not found`), so even the first upload errors.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20260623000001_create_post_media_buckets.sql`:

```sql
-- Private staging bucket: clients upload originals here; never publicly served.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('post-media-staging', 'post-media-staging', false, 8388608)
ON CONFLICT (id) DO NOTHING;

-- Public delivery bucket: ONLY the edge function (service role) writes here.
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

-- Staging: a user may upload only under their own {uid}/ prefix.
CREATE POLICY "Users upload post media to their own staging folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media-staging'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public read for delivered post media.
CREATE POLICY "Public read access for post media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-media');

-- Owner may delete their own delivered objects (cleanup on post delete / failed create).
-- No INSERT/UPDATE policy exists for post-media, so clients cannot publish — only the
-- service-role edge function can write, which is the metadata-strip guarantee.
CREATE POLICY "Users delete their own post media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Defense in depth: cap media_urls at 4 at the database boundary.
ALTER TABLE public.posts
  ADD CONSTRAINT posts_media_urls_max_four
  CHECK (coalesce(array_length(media_urls, 1), 0) <= 4);
```

- [ ] **Step 4: Apply the migration to the local stack**

Run: `supabase db reset`
Expected: migrations apply cleanly, including `20260623000001_create_post_media_buckets`.

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run __tests__/rpc/post-media-policies.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260623000001_create_post_media_buckets.sql __tests__/rpc/post-media-policies.test.ts
git commit -m "feat(storage): post-media buckets + RLS guaranteeing server-only publish"
```

---

### Task 2: `strip-image-metadata` edge function

Decodes the staged JPEG and re-encodes it (dropping all metadata), publishes to `post-media`, deletes the staging original. Verified by an integration test that uploads a JPEG carrying a synthetic EXIF/GPS segment, invokes the function, and asserts the published bytes contain no EXIF marker and still decode as JPEG.

**Files:**
- Create: `supabase/functions/_shared/strip-image-metadata.ts`
- Create: `supabase/functions/strip-image-metadata/index.ts`
- Test: `__tests__/rpc/strip-image-metadata.test.ts`

**Interfaces:**
- Consumes: buckets from Task 1; `Authorization` JWT; request body `{ stagingPath: string }`.
- Produces: HTTP `200 { url: string }` (public URL of the cleaned JPEG in `post-media`). The shared module exports `stripToCleanJpeg(input: Uint8Array): Promise<Uint8Array>` and `MAX_INPUT_BYTES`, `MAX_PIXELS`, `jpegPixelCount(bytes: Uint8Array): number | null`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/rpc/strip-image-metadata.test.ts`:

```ts
import { authedClientFor } from "../utils/auth-helpers";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, cleanupTestData, TestUser } from "../utils/seed";

// 1x1 baseline JPEG (no metadata).
const BASE_1X1_JPEG_B64 =
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof" +
  "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh" +
  "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR" +
  "CAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAA" +
  "AgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkK" +
  "FhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWG" +
  "h4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl" +
  "5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREA" +
  "AgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYk" +
  "NOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOE" +
  "hYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk" +
  "5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD/2Q==";

const SENTINEL = "GPSLAT37.7749N";

const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0));

const indexOfSeq = (hay: Uint8Array, needle: Uint8Array): number => {
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
};

// Insert an APP1 "Exif\0\0<SENTINEL>" segment right after the SOI marker.
const injectExif = (base: Uint8Array): Uint8Array => {
  const content = new Uint8Array([
    ...ascii("Exif"),
    0,
    0,
    ...ascii(SENTINEL),
  ]);
  const len = content.length + 2;
  const segment = new Uint8Array([
    0xff,
    0xe1,
    (len >> 8) & 0xff,
    len & 0xff,
    ...content,
  ]);
  const out = new Uint8Array(base.length + segment.length);
  out.set(base.subarray(0, 2), 0); // SOI
  out.set(segment, 2);
  out.set(base.subarray(2), 2 + segment.length);
  return out;
};

describe("strip-image-metadata edge function", () => {
  let user: TestUser;
  let stagingPath: string;
  let publishedPath: string | null = null;

  beforeAll(async () => {
    user = await createTestUser({ full_name: "Strip Sam" });
    stagingPath = `${user.id}/${Date.now()}.jpg`;
    const base = Uint8Array.from(atob(BASE_1X1_JPEG_B64), (c) =>
      c.charCodeAt(0)
    );
    const dirty = injectExif(base);
    // Sanity: the dirty input really carries our metadata.
    expect(indexOfSeq(dirty, ascii(SENTINEL))).toBeGreaterThan(-1);

    const { error } = await adminClient.storage
      .from("post-media-staging")
      .upload(stagingPath, dirty, { contentType: "image/jpeg", upsert: true });
    expect(error).toBeNull();
  });

  afterAll(async () => {
    await adminClient.storage.from("post-media-staging").remove([stagingPath]);
    if (publishedPath) {
      await adminClient.storage.from("post-media").remove([publishedPath]);
    }
    await cleanupTestData([user.id]);
  });

  it("publishes a metadata-free JPEG and removes the staging original", async () => {
    const client = await authedClientFor(user.email);
    const { data, error } = await client.functions.invoke(
      "strip-image-metadata",
      { body: { stagingPath } }
    );
    expect(error).toBeNull();
    expect(data?.url).toMatch(/\/post-media\//);

    publishedPath = decodeURIComponent(
      data!.url.split("/post-media/")[1].split("?")[0]
    );

    const res = await fetch(data!.url);
    const out = new Uint8Array(await res.arrayBuffer());

    // Valid JPEG.
    expect(out[0]).toBe(0xff);
    expect(out[1]).toBe(0xd8);
    // No EXIF marker, no GPS sentinel.
    expect(indexOfSeq(out, ascii("Exif"))).toBe(-1);
    expect(indexOfSeq(out, ascii(SENTINEL))).toBe(-1);

    // Staging original deleted.
    const { error: dlErr } = await adminClient.storage
      .from("post-media-staging")
      .download(stagingPath);
    expect(dlErr).not.toBeNull();
  });

  it("rejects a staging path the caller does not own", async () => {
    const other = await createTestUser({ full_name: "Other Olive" });
    const client = await authedClientFor(other.email);
    const { error } = await client.functions.invoke("strip-image-metadata", {
      body: { stagingPath },
    });
    expect(error).not.toBeNull();
    await cleanupTestData([other.id]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run __tests__/rpc/strip-image-metadata.test.ts`
Expected: FAIL — function does not exist; `invoke` returns an error (non-2xx).

- [ ] **Step 3: Write the shared strip module**

Create `supabase/functions/_shared/strip-image-metadata.ts`:

```ts
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const MAX_PIXELS = 50_000_000;

// Read width*height from a JPEG's SOF marker without fully decoding it.
export function jpegPixelCount(bytes: Uint8Array): number | null {
  let i = 2; // skip SOI (FFD8)
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = bytes[i + 1];
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      const height = (bytes[i + 5] << 8) | bytes[i + 6];
      const width = (bytes[i + 7] << 8) | bytes[i + 8];
      return width * height;
    }
    const segLen = (bytes[i + 2] << 8) | bytes[i + 3];
    if (segLen < 2) return null;
    i += 2 + segLen;
  }
  return null;
}

// Decode pixels then re-encode JPEG. The output is built solely from pixel
// data, so all EXIF/GPS/IPTC/XMP is dropped.
export async function stripToCleanJpeg(input: Uint8Array): Promise<Uint8Array> {
  if (input.byteLength > MAX_INPUT_BYTES) {
    throw new Error("Image too large");
  }
  const pixels = jpegPixelCount(input);
  if (pixels !== null && pixels > MAX_PIXELS) {
    throw new Error("Image dimensions too large");
  }
  const image = await Image.decode(input);
  return await image.encodeJPEG(80);
}
```

- [ ] **Step 4: Write the edge function**

Create `supabase/functions/strip-image-metadata/index.ts`:

```ts
import { createClient } from "npm:@supabase/supabase-js@2.35.0";
import { stripToCleanJpeg } from "../_shared/strip-image-metadata.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader =
      req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.split(" ")[1]?.trim();

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } =
      await userClient.auth.getUser(token);
    if (authError || !authData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = authData.user.id;

    const { stagingPath } = await req.json();
    if (typeof stagingPath !== "string" || !stagingPath) {
      return json({ error: "Missing stagingPath" }, 400);
    }
    if (!stagingPath.startsWith(`${userId}/`)) {
      return json({ error: "Forbidden" }, 403);
    }

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: blob, error: dlError } = await service.storage
      .from("post-media-staging")
      .download(stagingPath);
    if (dlError || !blob) {
      return json({ error: "Staged file not found" }, 404);
    }

    const input = new Uint8Array(await blob.arrayBuffer());

    let cleaned: Uint8Array;
    try {
      cleaned = await stripToCleanJpeg(input);
    } catch (err) {
      return json(
        { error: "Invalid image", details: String(err) },
        422
      );
    }

    const outPath = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error: upError } = await service.storage
      .from("post-media")
      .upload(outPath, cleaned, { contentType: "image/jpeg", upsert: false });
    if (upError) {
      return json({ error: "Publish failed", details: upError.message }, 500);
    }

    await service.storage.from("post-media-staging").remove([stagingPath]);

    const {
      data: { publicUrl },
    } = service.storage.from("post-media").getPublicUrl(outPath);

    return json({ url: publicUrl }, 200);
  } catch (err) {
    return json({ error: "Internal error", details: String(err) }, 500);
  }
});
```

- [ ] **Step 5: Restart the local edge runtime so the new function is served**

Run: `supabase stop && supabase start`
Expected: stack restarts; the edge runtime now serves `strip-image-metadata` at `/functions/v1/strip-image-metadata`.
(If the local CLI hot-reloads functions, this restart is a no-op safety step.)

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run __tests__/rpc/strip-image-metadata.test.ts`
Expected: PASS (2 tests). First invoke may take a few seconds while the runtime fetches `imagescript`.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/strip-image-metadata.ts supabase/functions/strip-image-metadata/index.ts __tests__/rpc/strip-image-metadata.test.ts
git commit -m "feat(functions): strip-image-metadata edge function (server-enforced strip)"
```

---

### Task 3: `postMediaPathsFromUrls` helper + delete-time cleanup

Pure helper that maps published public URLs back to storage object paths, plus wiring `useDeletePost` to best-effort remove a post's media on delete. Independently testable via the pure helper.

**Files:**
- Create: `utils/postMedia.ts`
- Modify: `hooks/usePosts.ts:196-217` (`useDeletePost`)
- Test: `__tests__/utils/postMedia.test.ts`

**Interfaces:**
- Produces: `postMediaPathsFromUrls(urls: string[]): string[]` — extracts `"{uid}/{file}.jpg"` from each `…/post-media/{uid}/{file}.jpg[?query]` URL, ignoring non-`post-media` URLs.
- Consumes: the `post-media` owner-DELETE policy from Task 1.

- [ ] **Step 1: Write the failing test**

Create `__tests__/utils/postMedia.test.ts`:

```ts
import { postMediaPathsFromUrls } from "../../utils/postMedia";

describe("postMediaPathsFromUrls", () => {
  it("extracts the object path from a public post-media URL", () => {
    const urls = [
      "https://abc.supabase.co/storage/v1/object/public/post-media/u1/p1.jpg",
    ];
    expect(postMediaPathsFromUrls(urls)).toEqual(["u1/p1.jpg"]);
  });

  it("strips query strings", () => {
    const urls = [
      "https://abc.supabase.co/storage/v1/object/public/post-media/u1/p1.jpg?t=9",
    ];
    expect(postMediaPathsFromUrls(urls)).toEqual(["u1/p1.jpg"]);
  });

  it("ignores URLs that are not post-media objects", () => {
    const urls = [
      "https://abc.supabase.co/storage/v1/object/public/avatars/u1.jpg",
      "https://example.com/x.jpg",
    ];
    expect(postMediaPathsFromUrls(urls)).toEqual([]);
  });

  it("handles an empty list", () => {
    expect(postMediaPathsFromUrls([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run __tests__/utils/postMedia.test.ts`
Expected: FAIL — `Cannot find module '../../utils/postMedia'`.

- [ ] **Step 3: Write the helper**

Create `utils/postMedia.ts`:

```ts
const MARKER = "/post-media/";

export function postMediaPathsFromUrls(urls: string[]): string[] {
  const paths: string[] = [];
  for (const url of urls) {
    const idx = url.indexOf(MARKER);
    if (idx === -1) continue;
    const path = url.slice(idx + MARKER.length).split("?")[0];
    if (path) paths.push(path);
  }
  return paths;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run __tests__/utils/postMedia.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire cleanup into `useDeletePost`**

In `hooks/usePosts.ts`, add the import near the other imports (after line 12):

```ts
import { postMediaPathsFromUrls } from "@/utils/postMedia";
```

Replace the `mutationFn` of `useDeletePost` (currently `hooks/usePosts.ts:202-210`) with:

```ts
    mutationFn: async (postId: string) => {
      const { data: existing } = await supabase
        .from("posts")
        .select("media_urls")
        .eq("id", postId)
        .eq("author_id", profile.id)
        .maybeSingle();

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("author_id", profile.id);

      if (error) throw error;

      const paths = postMediaPathsFromUrls(existing?.media_urls ?? []);
      if (paths.length > 0) {
        try {
          await supabase.storage.from("post-media").remove(paths);
        } catch {
          // Best-effort cleanup; never fail the delete on orphaned media.
        }
      }
    },
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add utils/postMedia.ts __tests__/utils/postMedia.test.ts hooks/usePosts.ts
git commit -m "feat(posts): clean up post-media objects when a post is deleted"
```

---

### Task 4: `useUploadPostImages` hook

Owns the picked-photo state and the submit-time publish pipeline (manipulate → upload to staging → invoke `strip-image-metadata`). No unit test — it wraps native modules (`expo-image-picker`/`expo-image-manipulator`), matching the untested `useUploadAvatar` precedent; verified by typecheck and manual run.

**Files:**
- Create: `hooks/useUploadPostImages.ts`

**Interfaces:**
- Consumes: `useSupabase()` (`supabase`, `session`); the `strip-image-metadata` function (Task 2); staging bucket (Task 1).
- Produces: `useUploadPostImages()` →
  - `photos: { localUri: string }[]`
  - `pick(): Promise<void>` — opens the library (multi, cap 4 total), manipulates each pick to an upright JPEG, appends to `photos`.
  - `removeAt(index: number): void`
  - `reset(): void`
  - `publishAll(): Promise<string[]>` — uploads each photo to staging and invokes the edge function; resolves to clean public URLs (order preserved). Throws on any failure.
  - `isPicking: boolean`, `isPublishing: boolean`
  - `MAX_PHOTOS: number`

- [ ] **Step 1: Write the hook**

Create `hooks/useUploadPostImages.ts`:

```ts
import { useState, useCallback } from "react";
import { Alert } from "react-native";

import { useSupabase } from "./useSupabase";

export const MAX_PHOTOS = 4;

interface PickedPhoto {
  localUri: string;
}

export function useUploadPostImages() {
  const { supabase, session } = useSupabase();
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const pick = useCallback(async () => {
    setIsPicking(true);
    try {
      const ImagePicker = await import("expo-image-picker");
      const ImageManipulator = await import("expo-image-manipulator");

      const remaining = MAX_PHOTOS - photos.length;
      if (remaining <= 0) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 1,
      });
      if (result.canceled) return;

      const manipulated: PickedPhoto[] = [];
      for (const asset of result.assets) {
        const ops =
          asset.width && asset.width > 1600
            ? [{ resize: { width: 1600 } }]
            : [];
        const out = await ImageManipulator.manipulateAsync(asset.uri, ops, {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        manipulated.push({ localUri: out.uri });
      }

      setPhotos((prev) => [...prev, ...manipulated].slice(0, MAX_PHOTOS));
    } catch (err) {
      Alert.alert("Couldn't add photo", String(err));
    } finally {
      setIsPicking(false);
    }
  }, [photos.length]);

  const removeAt = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reset = useCallback(() => setPhotos([]), []);

  const publishOne = useCallback(
    async (photo: PickedPhoto, userId: string): Promise<string> => {
      const response = await fetch(photo.localUri);
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > 10 * 1024 * 1024) {
        throw new Error("Photo is too large. Please choose a smaller one.");
      }

      const stagingPath = `${userId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`;
      const { error: upError } = await supabase.storage
        .from("post-media-staging")
        .upload(stagingPath, arrayBuffer, { contentType: "image/jpeg" });
      if (upError) throw upError;

      const { data, error } = await supabase.functions.invoke(
        "strip-image-metadata",
        { body: { stagingPath } }
      );
      if (error) throw error;
      if (!data?.url) throw new Error("Image processing failed");
      return data.url as string;
    },
    [supabase]
  );

  const publishAll = useCallback(async (): Promise<string[]> => {
    const userId = session?.user?.id;
    if (!userId) throw new Error("Not authenticated");
    if (photos.length === 0) return [];

    setIsPublishing(true);
    try {
      return await Promise.all(photos.map((p) => publishOne(p, userId)));
    } finally {
      setIsPublishing(false);
    }
  }, [photos, session?.user?.id, publishOne]);

  return {
    photos,
    pick,
    removeAt,
    reset,
    publishAll,
    isPicking,
    isPublishing,
    MAX_PHOTOS,
  };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add hooks/useUploadPostImages.ts
git commit -m "feat(posts): useUploadPostImages hook (pick, manipulate, publish via strip fn)"
```

---

### Task 5: Composer photo UI (`PostForm` + `create-post`)

Adds an "Add photo" button and a thumbnail row with per-photo remove to the composer, and wires the create screen to publish photos before inserting the post (with best-effort cleanup if the insert fails). No unit test — RN UI, matching repo conventions; verified by typecheck and manual run.

**Files:**
- Modify: `components/PostForm.tsx`
- Modify: `app/(protected)/create-post.tsx`

**Interfaces:**
- Consumes: `useUploadPostImages()` (Task 4); `postMediaPathsFromUrls` (Task 3); `useCreatePost()` (`media_urls` already accepted).
- Produces: `PostForm` gains optional props `photos?: { localUri: string }[]`, `onAddPhoto?: () => void`, `onRemovePhoto?: (index: number) => void`, `canAddPhoto?: boolean`. When `onAddPhoto` is omitted, no photo UI renders (edit-post stays unchanged).

- [ ] **Step 1: Add photo UI to `PostForm`**

In `components/PostForm.tsx`, update the imports on line 1-2 to add `Image` and `ActivityIndicator` usage. Replace the import block (lines 1-6) with:

```tsx
import React from "react";
import { View, Pressable } from "react-native";
import { Image } from "expo-image";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Input, Icons, colors, ListChip, Text } from "@/design-system";
import { AttachedList } from "@/types/post";
```

Replace the `PostFormProps` interface (lines 15-21) with:

```tsx
interface PostFormProps {
  control: Control<PostFormData>;
  errors: FieldErrors<PostFormData>;
  selectedList?: AttachedList | null;
  onAttachList?: () => void;
  onRemoveList?: () => void;
  photos?: { localUri: string }[];
  onAddPhoto?: () => void;
  onRemovePhoto?: (index: number) => void;
  canAddPhoto?: boolean;
}
```

Replace the function signature and destructure (lines 23-29) with:

```tsx
export function PostForm({
  control,
  errors,
  selectedList,
  onAttachList,
  onRemoveList,
  photos = [],
  onAddPhoto,
  onRemovePhoto,
  canAddPhoto = true,
}: PostFormProps) {
```

Then, immediately after the closing `/>` of the `Controller` block (after line 47, before the `{/* Selected List Display */}` comment), insert the photo section:

```tsx
      {onAddPhoto && (
        <View className="mt-3">
          {photos.length > 0 && (
            <View className="flex-row flex-wrap">
              {photos.map((photo, index) => (
                <View key={photo.localUri} className="mr-2 mb-2">
                  <Image
                    source={{ uri: photo.localUri }}
                    style={{ width: 72, height: 72, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => onRemovePhoto?.(index)}
                    hitSlop={8}
                    className="absolute -top-1.5 -right-1.5 bg-gray-900 rounded-full p-0.5"
                  >
                    <Icons.close size={14} color={colors.hex.cream} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {canAddPhoto && (
            <Pressable
              onPress={onAddPhoto}
              className="flex-row items-center mt-1"
            >
              <Icons.camera size={20} color={colors.hex.purple600} />
              <Text className="ml-2 text-purple-600 font-medium">
                Add photo
              </Text>
            </Pressable>
          )}
        </View>
      )}
```

- [ ] **Step 2: Verify the `camera` icon exists (use a fallback if not)**

Run: `grep -nE "camera|image|photo" design-system/Icons.tsx`
Expected: confirm an icon key to use. If `Icons.camera` is absent, use an existing image-ish icon (e.g. `Icons.list` is wrong — pick the closest available such as `Icons.globe`); update the `<Icons.camera …>` reference in Step 1 accordingly. Do not invent an icon name.

- [ ] **Step 3: Wire `create-post` to publish photos and clean up on failure**

In `app/(protected)/create-post.tsx`, add imports after line 18:

```ts
import { useUploadPostImages } from "@/hooks/useUploadPostImages";
import { postMediaPathsFromUrls } from "@/utils/postMedia";
import { useSupabase } from "@/hooks/useSupabase";
```

After `const createPost = useCreatePost();` (line 22) add:

```ts
  const { supabase } = useSupabase();
  const photos = useUploadPostImages();
```

Replace the `onSubmit` function (lines 37-49) with:

```ts
  const onSubmit = async (data: PostFormData) => {
    let mediaUrls: string[] = [];
    try {
      mediaUrls = await photos.publishAll();
    } catch (err) {
      logger.error("Error uploading photos:", err);
      Alert.alert("Error", "Failed to upload photos. Please try again.");
      return;
    }

    try {
      await createPost.mutateAsync({
        text: data.text,
        visibility,
        media_urls: mediaUrls,
        list_id: selectedList?.id || null,
      });
      router.back();
    } catch (err) {
      logger.error("Error creating post:", err);
      if (mediaUrls.length > 0) {
        try {
          await supabase.storage
            .from("post-media")
            .remove(postMediaPathsFromUrls(mediaUrls));
        } catch {
          // Best-effort cleanup of orphaned media.
        }
      }
      Alert.alert("Error", "Failed to create post. Please try again.");
    }
  };
```

Pass the photo props to `PostForm` (replace lines 67-73):

```tsx
        <PostForm
          control={form.control}
          errors={form.formState.errors}
          selectedList={selectedList}
          onAttachList={() => router.push("/select-list")}
          onRemoveList={clearListSelection}
          photos={photos.photos}
          onAddPhoto={photos.pick}
          onRemovePhoto={photos.removeAt}
          canAddPhoto={photos.photos.length < photos.MAX_PHOTOS}
        />
```

Update the submit button's disabled/label state (replace lines 83-89) to account for uploading:

```tsx
        <Button
          variant="primary"
          onPress={form.handleSubmit(onSubmit)}
          disabled={
            createPost.isPending ||
            photos.isPublishing ||
            !!form.formState.errors.text
          }
        >
          {photos.isPublishing
            ? "Uploading photos..."
            : createPost.isPending
              ? "Posting..."
              : "Post"}
        </Button>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/PostForm.tsx "app/(protected)/create-post.tsx"
git commit -m "feat(posts): photo picker UI in composer with publish + cleanup"
```

---

### Task 6: Render post photos (`PostMediaGallery` + `PostCard`)

Renders `media_urls` in the feed. No unit test — pure RN presentational component, matching the untested `PostCard` precedent; verified by typecheck and manual run.

**Files:**
- Create: `components/PostMediaGallery.tsx`
- Modify: `design-system/PostCard.tsx`

**Interfaces:**
- Consumes: `post.media_urls` (already on `PostWithAuthor`).
- Produces: `<PostMediaGallery urls={string[]} />` — renders nothing for an empty list; 1 image full-width; 2–4 in a wrapped grid.

- [ ] **Step 1: Write `PostMediaGallery`**

Create `components/PostMediaGallery.tsx`:

```tsx
import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";

interface PostMediaGalleryProps {
  urls: string[];
}

export function PostMediaGallery({ urls }: PostMediaGalleryProps) {
  if (!urls || urls.length === 0) return null;

  if (urls.length === 1) {
    return (
      <View className="mb-2">
        <Image
          source={{ uri: urls[0] }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12 }}
          contentFit="cover"
        />
      </View>
    );
  }

  return (
    <View className="mb-2 flex-row flex-wrap" style={{ gap: 4 }}>
      {urls.map((url) => (
        <Image
          key={url}
          source={{ uri: url }}
          style={{
            width: "49%",
            aspectRatio: 1,
            borderRadius: 8,
          }}
          contentFit="cover"
        />
      ))}
    </View>
  );
}
```

- [ ] **Step 2: Render it in `PostCard`**

In `design-system/PostCard.tsx`, add the import after line 8:

```ts
import { PostMediaGallery } from "@/components/PostMediaGallery";
```

Insert the gallery between the post text and the attached list. After the post-text block (after line 138, the closing `</Text>` of the text block) and before the `{/* Attached list */}` comment, add:

```tsx
        {post.media_urls && post.media_urls.length > 0 && (
          <PostMediaGallery urls={post.media_urls} />
        )}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/PostMediaGallery.tsx design-system/PostCard.tsx
git commit -m "feat(posts): render post photos in the feed"
```

---

### Task 7: Full verification pass

Confirms the whole feature builds, lints, and the automated tests pass together; documents the manual device check.

**Files:** none (verification only)

- [ ] **Step 1: Typecheck the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Lint**

Run: `npx expo lint`
Expected: no new errors in the touched files. (Note: per the repo, `expo lint --fix` lints the entire repo — check `git status` afterward for unintended deletions of unused exports.)

- [ ] **Step 3: Run the new automated tests together**

Run: `npx vitest run __tests__/rpc/post-media-policies.test.ts __tests__/rpc/strip-image-metadata.test.ts __tests__/utils/postMedia.test.ts`
Expected: all PASS. (Requires the local Supabase stack running with migrations applied.)

- [ ] **Step 4: Run the full RPC suite for regressions**

Run: `npm run test:rpc`
Expected: PASS (no regressions from the `useDeletePost` change or the `media_urls` CHECK).

- [ ] **Step 5: Manual device/simulator check**

Verify on a dev client:
1. New Post → "Add photo" → pick 2–3 library photos → thumbnails appear with remove (×) buttons.
2. Remove one → it disappears; "Add photo" hidden once 4 are selected.
3. Post → button shows "Uploading photos..." then "Posting..." → returns to feed.
4. The post shows the photos in the feed; a single photo renders full-width, multiple render as a grid.
5. (Privacy) Pick a photo known to have GPS EXIF; after posting, download the published URL (from `post.media_urls`) and confirm via an EXIF viewer that no GPS/metadata remains. (The automated strip test already asserts this against a synthetic EXIF segment.)
6. Delete the post → its images are removed from `post-media` (best-effort).

- [ ] **Step 6: Final commit (if any lint/format fixups)**

```bash
git add -A
git commit -m "chore(posts): verification fixups for photo upload"
```

---

## Self-Review

**Spec coverage:**
- Library-only, ≤4 photos on create → Tasks 4, 5 (Global Constraints). ✅
- Hybrid strip (client re-encode → server re-strip) → Task 4 (manipulate) + Task 2 (edge fn). ✅
- Server-only writer to public bucket (the guarantee) → Task 1 policies + Task 2; proven by `post-media-policies.test.ts`. ✅
- Auto-orient before strip → handled by client `manipulateAsync` (Task 4), as in the avatar flow. ✅
- Decompression-bomb guard → `MAX_INPUT_BYTES` + `jpegPixelCount`/`MAX_PIXELS` (Task 2). ✅
- Publish-on-submit + cleanup on create failure → Task 5 `onSubmit`. ✅
- Cleanup on post delete → Task 3. ✅
- Public bucket / unguessable paths → Task 1. ✅
- Display gallery → Task 6. ✅
- `media_urls` length cap (defense in depth) → Task 1 CHECK. ✅
- Tests: storage policies, edge-fn strip integration, post-insert path → Tasks 1, 2 (post insert exercised via the existing `useCreatePost` path; `media_urls` column already covered by feed tests). ✅
- Out of scope (camera, edit-post photos, signed URLs, TTL sweep, moderation) → untouched. ✅

**Deviation from spec (intentional, noted):** `post-media` gets an owner-scoped DELETE policy (spec said "no INSERT/UPDATE/DELETE policy"). DELETE-for-owner is required to implement the spec's own cleanup requirement and does not weaken the guarantee, which is about blocking client *writes*.

**Placeholder scan:** No TBD/TODO; every code step shows complete code. The only conditional is Task 5 Step 2 (verify the exact icon key), which is a real verification step with an explicit fallback, not a placeholder.

**Type consistency:** `stagingPath` (string) consistent across hook, function, tests. `publishAll(): Promise<string[]>`, `photos: { localUri: string }[]`, `MAX_PHOTOS` consistent between Task 4 and Task 5. `postMediaPathsFromUrls(string[]): string[]` consistent across Tasks 3, 5. `{ url }` response shape consistent between Task 2 function, its test, and the hook.
