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
