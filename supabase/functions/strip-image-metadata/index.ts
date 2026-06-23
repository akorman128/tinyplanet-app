import { createClient } from "npm:@supabase/supabase-js@2.35.0";
import { stripToCleanJpeg } from "../_shared/strip-image-metadata.ts";
import { corsHeaders, json } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await requireUser(req);
    if (auth instanceof Response) return auth;
    const userId = auth.userId;

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
      return json({ error: "Invalid image", details: String(err) }, 422);
    }

    const outPath = `${userId}/${crypto.randomUUID()}.jpg`;
    const { error: upError } = await service.storage
      .from("post-media")
      .upload(outPath, cleaned, {
        contentType: "image/jpeg",
        upsert: false,
        cacheControl: "31536000",
      });
    if (upError) {
      return json({ error: "Publish failed", details: upError.message }, 500);
    }

    // Best-effort cleanup of the staging original — never fail the publish if it
    // can't be removed (e.g. a storage backend that blocks the delete).
    try {
      await service.storage.from("post-media-staging").remove([stagingPath]);
    } catch (_err) {
      /* best-effort */
    }

    const {
      data: { publicUrl },
    } = service.storage.from("post-media").getPublicUrl(outPath);

    return json({ url: publicUrl }, 200);
  } catch (err) {
    return json({ error: "Internal error", details: String(err) }, 500);
  }
});
