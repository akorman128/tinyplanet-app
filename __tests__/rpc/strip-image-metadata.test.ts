import { readFileSync } from "fs";
import { join } from "path";
import { authedClientFor } from "../utils/auth-helpers";
import { adminClient } from "../utils/supabase-test-client";
import { createTestUser, cleanupTestData, TestUser } from "../utils/seed";

// A real baseline JPEG (with its own EXIF block) that imagescript can decode.
const BASE_JPEG = new Uint8Array(
  readFileSync(join(process.cwd(), "__tests__/fixtures/strip-base.jpg"))
);

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
  const content = new Uint8Array([...ascii("Exif"), 0, 0, ...ascii(SENTINEL)]);
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
    const dirty = injectExif(BASE_JPEG);
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

  it("publishes a metadata-free JPEG from the staged original", async () => {
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

    // Read the published bytes via the SDK rather than the returned public
    // URL: locally the edge runtime's SUPABASE_URL is the internal Docker
    // gateway ("kong"), unresolvable from the host. In prod the URL is public.
    const { data: blob, error: dlErr } = await adminClient.storage
      .from("post-media")
      .download(publishedPath);
    expect(dlErr).toBeNull();
    const out = new Uint8Array(await blob!.arrayBuffer());

    // Valid JPEG.
    expect(out[0]).toBe(0xff);
    expect(out[1]).toBe(0xd8);
    // The whole point: no EXIF marker, no GPS sentinel survives.
    expect(indexOfSeq(out, ascii("Exif"))).toBe(-1);
    expect(indexOfSeq(out, ascii(SENTINEL))).toBe(-1);

    // NOTE: staging-original deletion is best-effort and can't be asserted on
    // this local stack (storage-api v1.29 allow_delete_query bug blocks all
    // API deletes). The publish guarantee above is what matters.
  }, 60_000);

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
